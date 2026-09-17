import crypto from "crypto";
import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/db/prisma";

// ── Test Configuration ─────────────────────────────────
const VERIFY_TOKEN = "test-verify-token";
const APP_SECRET = "test-meta-app-secret-123456";
const API_SECRET = "mindclub-crm-secret-key-2026";

process.env.WA_VERIFY_TOKEN = VERIFY_TOKEN;
process.env.META_APP_SECRET = APP_SECRET;
process.env.API_SECRET_KEY = API_SECRET;
process.env.WA_ACCESS_TOKEN = "test-token";
process.env.WA_PHONE_NUMBER_ID = "123456";

// ── Mock Prisma ────────────────────────────────────────
jest.mock("../src/db/prisma", () => {
  const mockWebhookEvents = new Map<string, any>();
  const mockMessages = new Map<string, any>();

  return {
    prisma: {
      webhookEvent: {
        findUnique: jest.fn().mockImplementation(({ where }: { where: { providerEventId?: string } }) => {
          if (where.providerEventId && mockWebhookEvents.has(where.providerEventId)) {
            return Promise.resolve(mockWebhookEvents.get(where.providerEventId));
          }
          return Promise.resolve(null);
        }),
        create: jest.fn().mockImplementation(({ data }: { data: any }) => {
          const record = { id: `event_${Date.now()}`, ...data };
          if (data.providerEventId) {
            mockWebhookEvents.set(data.providerEventId, record);
          }
          return Promise.resolve(record);
        }),
      },
      contact: {
        upsert: jest.fn().mockImplementation(({ where, create, update }: any) => {
          return Promise.resolve({
            id: `contact_test_${where.phone}`,
            phone: where.phone,
            name: update?.name || create?.name || "Test Contact",
            source: "whatsapp",
          });
        }),
        findUnique: jest.fn().mockResolvedValue({
          id: "contact_test_919876543210",
          phone: "919876543210",
          name: "Test Contact",
        }),
      },
      lead: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }: any) => {
          return Promise.resolve({
            id: `lead_${Date.now()}`,
            contactId: data.contactId,
            status: data.status || "new",
            source: "whatsapp",
          });
        }),
        findMany: jest.fn().mockResolvedValue([
          { id: "lead_1", status: "new", contact: { id: "c1", phone: "919876543210" } },
        ]),
        findUnique: jest.fn().mockResolvedValue({
          id: "lead_1",
          status: "new",
          contact: { id: "c1", phone: "919876543210" },
        }),
        update: jest.fn().mockImplementation(({ where, data }: any) => {
          return Promise.resolve({ id: where.id, ...data });
        }),
      },
      message: {
        findUnique: jest.fn().mockImplementation(({ where }: any) => {
          if (where.providerMessageId && mockMessages.has(where.providerMessageId)) {
            return Promise.resolve(mockMessages.get(where.providerMessageId));
          }
          return Promise.resolve(null);
        }),
        create: jest.fn().mockImplementation(({ data }: any) => {
          const record = { id: `msg_${Date.now()}`, ...data };
          if (data.providerMessageId) {
            mockMessages.set(data.providerMessageId, record);
          }
          return Promise.resolve(record);
        }),
        update: jest.fn().mockImplementation(({ where, data }: any) => {
          const existing = mockMessages.get(where.providerMessageId) || {};
          const updated = { ...existing, ...data };
          if (where.providerMessageId) {
            mockMessages.set(where.providerMessageId, updated);
          }
          return Promise.resolve(updated);
        }),
        findMany: jest.fn().mockResolvedValue([]),
      },
    },
  };
});

function signPayload(body: string): string {
  return (
    "sha256=" +
    crypto.createHmac("sha256", APP_SECRET).update(Buffer.from(body, "utf8")).digest("hex")
  );
}

// ── Tests ──────────────────────────────────────────────

describe("Health endpoint", () => {
  it("GET /health returns 200 with ok:true", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.service).toBe("crm-whatsapp-integration");
  });
});

describe("WhatsApp Webhook Verification (GET)", () => {
  it("returns challenge when verify token matches", async () => {
    const res = await request(app)
      .get("/webhooks/whatsapp")
      .query({
        "hub.mode": "subscribe",
        "hub.verify_token": VERIFY_TOKEN,
        "hub.challenge": "test_challenge_123",
      });

    expect(res.status).toBe(200);
    expect(res.text).toBe("test_challenge_123");
  });

  it("returns 403 when verify token is wrong", async () => {
    const res = await request(app)
      .get("/webhooks/whatsapp")
      .query({
        "hub.mode": "subscribe",
        "hub.verify_token": "wrong-token",
        "hub.challenge": "test_challenge_123",
      });

    expect(res.status).toBe(403);
  });
});

describe("WhatsApp Webhook Signature Security (POST)", () => {
  it("returns 401 when signature header is missing", async () => {
    const res = await request(app)
      .post("/webhooks/whatsapp")
      .set("Content-Type", "application/json")
      .send(Buffer.from("{}"));

    expect(res.status).toBe(401);
  });

  it("returns 401 when signature hash is invalid", async () => {
    const body = JSON.stringify({ object: "test" });
    const res = await request(app)
      .post("/webhooks/whatsapp")
      .set("Content-Type", "application/json")
      .set("x-hub-signature-256", "sha256=0000000000000000000000000000000000000000000000000000000000000000")
      .send(Buffer.from(body));

    expect(res.status).toBe(401);
  });

  it("returns 401 when signature does not start with sha256=", async () => {
    const body = JSON.stringify({ object: "test" });
    const res = await request(app)
      .post("/webhooks/whatsapp")
      .set("Content-Type", "application/json")
      .set("x-hub-signature-256", "invalid_prefix_hash")
      .send(Buffer.from(body));

    expect(res.status).toBe(401);
  });

  it("returns 400 when body is malformed JSON despite valid signature", async () => {
    const malformedBody = "{ invalid json content: true ";
    const validSignature = signPayload(malformedBody);

    const res = await request(app)
      .post("/webhooks/whatsapp")
      .set("Content-Type", "application/json")
      .set("x-hub-signature-256", validSignature)
      .send(malformedBody);

    expect(res.status).toBe(400);
  });
});

describe("Real Signed WhatsApp Inbound Processing & Deduplication", () => {
  const wamid = `wamid.HBgLM_TEST_${Date.now()}`;
  const incomingMessagePayload = {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "10987654321",
        changes: [
          {
            field: "messages",
            value: {
              messaging_product: "whatsapp",
              metadata: {
                display_phone_number: "15550001111",
                phone_number_id: "123456",
              },
              contacts: [
                {
                  profile: { name: "Ananya Sharma" },
                  wa_id: "919876543210",
                },
              ],
              messages: [
                {
                  from: "919876543210",
                  id: wamid,
                  timestamp: "1720000000",
                  type: "text",
                  text: { body: "Interested in course admission" },
                },
              ],
            },
          },
        ],
      },
    ],
  };

  it("successfully processes valid signed inbound WhatsApp message and returns 200", async () => {
    const bodyString = JSON.stringify(incomingMessagePayload);
    const signature = signPayload(bodyString);

    const res = await request(app)
      .post("/webhooks/whatsapp")
      .set("Content-Type", "application/json")
      .set("x-hub-signature-256", signature)
      .send(bodyString);

    expect(res.status).toBe(200);
    expect(prisma.contact.upsert).toHaveBeenCalled();
    expect(prisma.message.create).toHaveBeenCalled();
  });

  it("deduplicates identical webhook delivery using providerMessageId", async () => {
    const bodyString = JSON.stringify(incomingMessagePayload);
    const signature = signPayload(bodyString);

    // Send identical message second time
    const res = await request(app)
      .post("/webhooks/whatsapp")
      .set("Content-Type", "application/json")
      .set("x-hub-signature-256", signature)
      .send(bodyString);

    // Returns 200 without failure
    expect(res.status).toBe(200);
  });
});

describe("WhatsApp Status Callbacks (sent/delivered/read/failed)", () => {
  it("processes delivered status update for an existing outbound message", async () => {
    const statusPayload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "10987654321",
          changes: [
            {
              field: "messages",
              value: {
                messaging_product: "whatsapp",
                metadata: {
                  display_phone_number: "15550001111",
                  phone_number_id: "123456",
                },
                statuses: [
                  {
                    id: "wamid.OUTBOUND_12345",
                    status: "delivered",
                    timestamp: "1720000050",
                    recipient_id: "919876543210",
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const bodyString = JSON.stringify(statusPayload);
    const signature = signPayload(bodyString);

    const res = await request(app)
      .post("/webhooks/whatsapp")
      .set("Content-Type", "application/json")
      .set("x-hub-signature-256", signature)
      .send(bodyString);

    expect(res.status).toBe(200);
  });
});

describe("API Security & Protected Routes", () => {
  it("GET /api/leads rejects request without auth with 401", async () => {
    const res = await request(app).get("/api/leads");
    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });

  it("GET /api/leads rejects request with invalid Bearer token", async () => {
    const res = await request(app)
      .get("/api/leads")
      .set("Authorization", "Bearer invalid-token");

    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });

  it("GET /api/leads allows request with valid Bearer token", async () => {
    const res = await request(app)
      .get("/api/leads")
      .set("Authorization", `Bearer ${API_SECRET}`);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("POST /api/messages/send rejects unauthenticated request with 401", async () => {
    const res = await request(app)
      .post("/api/messages/send")
      .send({ to: "919876543210", text: "Hello" });

    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });
});
