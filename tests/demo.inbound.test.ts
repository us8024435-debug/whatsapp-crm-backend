import request from "supertest";
import { app } from "../src/app";

// Mock Prisma client for deterministic, offline testing
jest.mock("../src/db/prisma", () => {
  const contacts = new Map<string, any>();
  const leads = new Map<string, any>();
  const messages = new Map<string, any>();

  return {
    prisma: {
      contact: {
        findUnique: jest.fn().mockImplementation(({ where }: any) => {
          return Promise.resolve(contacts.get(where.phone) || null);
        }),
        upsert: jest.fn().mockImplementation(({ where, create, update }: any) => {
          let c = contacts.get(where.phone);
          if (!c) {
            c = { id: `c_${Date.now()}`, phone: where.phone, name: create.name, source: "whatsapp" };
          } else if (update.name) {
            c.name = update.name;
          }
          contacts.set(where.phone, c);
          return Promise.resolve(c);
        }),
        delete: jest.fn().mockResolvedValue({}),
      },
      lead: {
        findFirst: jest.fn().mockImplementation(({ where }: any) => {
          for (const l of leads.values()) {
            if (l.contactId === where.contactId && ["new", "contacted"].includes(l.status)) {
              return Promise.resolve(l);
            }
          }
          return Promise.resolve(null);
        }),
        create: jest.fn().mockImplementation(({ data }: any) => {
          const l = { id: `l_${Date.now()}`, ...data };
          leads.set(l.id, l);
          return Promise.resolve(l);
        }),
        update: jest.fn().mockImplementation(({ where, data }: any) => {
          const l = leads.get(where.id) || {};
          const updated = { ...l, ...data };
          leads.set(where.id, updated);
          return Promise.resolve(updated);
        }),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      message: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }: any) => {
          const m = { id: `m_${Date.now()}`, ...data };
          messages.set(m.id, m);
          return Promise.resolve(m);
        }),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    },
  };
});

describe("Demo Inbound Message API - POST /api/demo/inbound-message", () => {
  const testPhone = "919876543210";
  const testName = "Demo Tester";

  it("1. Creates new Contact, new Lead, and saves Inbound Message for new customer", async () => {
    const res = await request(app)
      .post("/api/demo/inbound-message")
      .send({
        phone: testPhone,
        name: testName,
        message: "Hi, I am interested in web development internship",
        interestType: "internship",
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.contactCreated).toBe(true);
    expect(res.body.leadCreated).toBe(true);
    expect(res.body.messageSaved).toBe(true);

    expect(res.body.data.contact.id).toBeDefined();
    expect(res.body.data.contact.phone).toBe(testPhone);
    expect(res.body.data.lead.id).toBeDefined();
    expect(res.body.data.lead.status).toBe("new");
    expect(res.body.data.message.id).toBeDefined();
    expect(res.body.data.message.direction).toBe("inbound");
  });

  it("2. Updates existing Contact and does NOT duplicate Lead when open lead exists", async () => {
    const res = await request(app)
      .post("/api/demo/inbound-message")
      .send({
        phone: testPhone,
        name: "Demo Tester Updated",
        message: "Following up on my application",
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.contactCreated).toBe(false);
    expect(res.body.leadCreated).toBe(false);
    expect(res.body.messageSaved).toBe(true);
    expect(res.body.data.contact.name).toBe("Demo Tester Updated");
  });

  it("3. Validates required fields and returns 400 on invalid input", async () => {
    const res = await request(app)
      .post("/api/demo/inbound-message")
      .send({
        phone: "123", // too short
      });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toBe("Validation failed");
    expect(res.body.details).toHaveProperty("phone");
    expect(res.body.details).toHaveProperty("name");
    expect(res.body.details).toHaveProperty("message");
  });

  it("4. Blocks demo route with 404 when NODE_ENV is set to production", async () => {
    const originalEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = "production";
      const res = await request(app)
        .post("/api/demo/inbound-message")
        .send({
          phone: testPhone,
          name: testName,
          message: "Testing production blocking",
        });

      expect(res.status).toBe(404);
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });
});
