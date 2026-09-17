# CRM + WhatsApp Integration MVP Roadmap

Prepared as a senior lead developer blueprint for a backend-first MVP using Google Antigravity IDE.

## 1. Product Goal

Build a backend system that connects WhatsApp Business messaging with a CRM-style lead and customer workflow.

MVP outcome:

- WhatsApp incoming messages are received through a secure webhook.
- New customers are automatically saved as contacts/leads.
- Each conversation and message is stored in the database.
- Founder/admin/team can receive notifications or inspect the lead data.
- Backend can send WhatsApp replies through the WhatsApp Cloud API.
- System is structured so HubSpot, Zoho, Salesforce, custom CRM, Google Sheets, or an internal dashboard can be added later through adapters.

This project should be built as a clean backend product first. UI/dashboard can come later.

## 2. Recommended Tech Stack

Core backend:

- Node.js 20+
- TypeScript
- Express.js for HTTP APIs and webhooks
- PostgreSQL for persistent CRM data
- Prisma ORM for schema and migrations
- Zod for request validation
- Axios or native fetch for WhatsApp Graph API calls
- Pino for structured logging
- Jest + Supertest for tests
- Swagger/OpenAPI for API documentation

Async and production support:

- Redis + BullMQ for background jobs
- Docker Compose for local Postgres/Redis
- Ngrok or Cloudflare Tunnel for local webhook testing
- GitHub Actions for CI later
- Render, Railway, Fly.io, VPS, or AWS Lightsail for deployment

External integrations:

- WhatsApp Cloud API
- Meta webhook verification and signature validation
- Optional future CRM adapters: HubSpot, Zoho, Salesforce, Airtable, Google Sheets

IDE workflow:

- Google Antigravity IDE for agent-driven implementation, code review, testing, and artifact generation.

## 3. MVP Scope

Day-2 MVP should include only the minimum viable backend:

- Health endpoint: `GET /health`
- WhatsApp webhook verification: `GET /webhooks/whatsapp`
- WhatsApp incoming message receiver: `POST /webhooks/whatsapp`
- Store raw webhook event safely
- Deduplicate events using provider message ID
- Create or update contact by WhatsApp phone number
- Create lead if contact is new
- Save inbound message
- Send simple outbound WhatsApp text message
- Admin API to list leads and messages
- Basic documentation and `.env.example`

Do not overbuild dashboard, complex campaigns, automation builder, AI bot, payment flows, or multi-tenant billing in the first two days.

## 4. High-Level Architecture

```mermaid
flowchart LR
  WA[WhatsApp User] --> META[Meta WhatsApp Cloud API]
  META --> WEBHOOK[Express Webhook API]
  WEBHOOK --> VERIFY[Signature + Verify Token]
  VERIFY --> EVENT[Raw Webhook Event Store]
  EVENT --> NORMALIZE[Normalize Contact + Message]
  NORMALIZE --> DB[(PostgreSQL)]
  NORMALIZE --> LEAD[Lead Service]
  LEAD --> CRM[CRM Adapter Layer]
  CRM --> INTERNAL[Internal CRM Tables]
  CRM -.future.-> HUBSPOT[HubSpot/Zoho/Salesforce]
  LEAD --> JOBS[Redis/BullMQ Jobs]
  JOBS --> NOTIFY[Founder/Team WhatsApp Notification]
  API[Admin/API Clients] --> BACKEND[Express REST API]
  BACKEND --> DB
  BACKEND --> META
```

## 5. Repository Structure

For MVP, use one backend repository:

```text
crm-whatsapp-integration/
  package.json
  tsconfig.json
  .env.example
  docker-compose.yml
  prisma/
    schema.prisma
    migrations/
  src/
    app.ts
    server.ts
    config/
      env.ts
    db/
      prisma.ts
    modules/
      health/
        health.routes.ts
      whatsapp/
        whatsapp.routes.ts
        whatsapp.controller.ts
        whatsapp.service.ts
        whatsapp.signature.ts
        whatsapp.types.ts
      crm/
        crm.adapter.ts
        internal-crm.adapter.ts
        crm.service.ts
      contacts/
        contacts.service.ts
      leads/
        leads.routes.ts
        leads.service.ts
      messages/
        messages.routes.ts
        messages.service.ts
    jobs/
      queue.ts
      notify-founder.job.ts
    middleware/
      error-handler.ts
      request-logger.ts
    utils/
      async-handler.ts
  tests/
    whatsapp.webhook.test.ts
  docs/
    01-product-scope.md
    02-architecture.md
    03-api-contract.md
    04-database-model.md
    05-whatsapp-setup.md
    06-deployment-runbook.md
    07-security-checklist.md
```

Later, if the project grows, move to a monorepo:

```text
apps/api
apps/admin-dashboard
packages/core
packages/integrations
packages/shared-types
docs
infra
```

## 6. Database Model

Core tables:

- `Organization`: company/project owner
- `User`: admin/team members
- `Contact`: real customer/person
- `Lead`: sales or support opportunity
- `Conversation`: WhatsApp conversation thread
- `Message`: inbound/outbound messages
- `WebhookEvent`: raw provider event for audit and replay
- `IntegrationAccount`: WhatsApp/CRM connection configuration
- `AuditLog`: important actions and security events

Suggested Prisma models:

```prisma
model Contact {
  id          String   @id @default(cuid())
  phone       String   @unique
  name        String?
  source      String   @default("whatsapp")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  leads       Lead[]
  messages    Message[]
}

model Lead {
  id          String   @id @default(cuid())
  contactId   String
  status      String   @default("new")
  source      String   @default("whatsapp")
  title       String?
  notes       String?
  contact     Contact  @relation(fields: [contactId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Message {
  id                String   @id @default(cuid())
  providerMessageId String?  @unique
  contactId         String
  direction         String
  type              String
  text              String?
  status            String?
  rawPayload        Json?
  contact           Contact  @relation(fields: [contactId], references: [id])
  createdAt         DateTime @default(now())
}

model WebhookEvent {
  id              String   @id @default(cuid())
  providerEventId String?  @unique
  source          String
  eventType       String?
  payload         Json
  processedAt     DateTime?
  createdAt       DateTime @default(now())
}
```

## 7. API Design

Public/internal endpoints:

- `GET /health`
- `GET /webhooks/whatsapp`
- `POST /webhooks/whatsapp`
- `POST /api/messages/send`
- `GET /api/leads`
- `GET /api/leads/:id`
- `PATCH /api/leads/:id/status`
- `GET /api/contacts/:id/messages`

Webhook rule:

- `GET /webhooks/whatsapp` verifies Meta webhook setup.
- `POST /webhooks/whatsapp` must validate signature, save event, process async, and return quickly.

## 8. NPM Setup

```bash
mkdir crm-whatsapp-integration
cd crm-whatsapp-integration
npm init -y
npm install express dotenv zod pino pino-http @prisma/client
npm install -D typescript tsx nodemon prisma @types/node @types/express jest supertest ts-jest
npx tsc --init
npx prisma init
```

Recommended `package.json` scripts:

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "test": "jest"
  }
}
```

## 9. Minimum Starter Code

`src/app.ts`

```ts
import express from "express";
import pinoHttp from "pino-http";
import { whatsappRouter } from "./modules/whatsapp/whatsapp.routes";

export const app = express();

app.use(pinoHttp());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "crm-whatsapp-integration" });
});

app.use("/webhooks/whatsapp", whatsappRouter);
```

`src/server.ts`

```ts
import { app } from "./app";

const port = Number(process.env.PORT || 3000);

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
```

`src/modules/whatsapp/whatsapp.routes.ts`

```ts
import express from "express";
import crypto from "crypto";

export const whatsappRouter = express.Router();

whatsappRouter.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.WA_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

whatsappRouter.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.header("x-hub-signature-256");

    if (!isValidMetaSignature(req.body, signature)) {
      return res.sendStatus(401);
    }

    const payload = JSON.parse(req.body.toString("utf8"));

    // MVP flow:
    // 1. Save raw webhook event
    // 2. Extract contact and message
    // 3. Create/update contact
    // 4. Create lead if needed
    // 5. Save message
    // 6. Queue notification

    return res.sendStatus(200);
  }
);

function isValidMetaSignature(rawBody: Buffer, signature?: string) {
  const appSecret = process.env.META_APP_SECRET;

  if (!appSecret || !signature) {
    return false;
  }

  const expected =
    "sha256=" +
    crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
```

`.env.example`

```env
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/crm_whatsapp"
WA_VERIFY_TOKEN="replace-with-random-webhook-token"
WA_ACCESS_TOKEN="replace-with-meta-access-token"
WA_PHONE_NUMBER_ID="replace-with-phone-number-id"
META_APP_SECRET="replace-with-meta-app-secret"
FOUNDER_WHATSAPP="91xxxxxxxxxx"
CRM_PROVIDER="internal"
```

## 10. Two-Day MVP Execution Plan

Day 0 preparation:

- Confirm Meta Business account, WABA, phone number ID, access token, app secret.
- Create Git repository.
- Create `.env.example` but never commit real tokens.
- Decide deployment target and database.

Day 1 morning:

- Scaffold Node + TypeScript + Express project.
- Add health endpoint.
- Add Prisma + PostgreSQL schema.
- Create migrations.
- Add webhook GET verification.

Day 1 afternoon:

- Add webhook POST receiver.
- Add signature validation.
- Save raw webhook events.
- Normalize WhatsApp payload into contact and message data.
- Test with ngrok/Cloudflare Tunnel.

Day 2 morning:

- Create contact/lead/message services.
- Add deduplication by provider message ID.
- Add outbound message service.
- Add admin APIs for leads and messages.

Day 2 afternoon:

- Add basic tests.
- Add API documentation.
- Deploy to staging.
- Configure Meta webhook URL.
- Run smoke test: inbound message creates lead; outbound reply sends WhatsApp message.

## 11. Antigravity IDE Prompt Pack

Use these prompts one by one inside Google Antigravity IDE.

Prompt 1: repository setup

```text
You are a senior backend engineer. Create a Node.js 20 + TypeScript + Express backend for a CRM WhatsApp integration MVP. Use clean modular architecture, Prisma, PostgreSQL, Zod validation, pino logging, and Jest tests. Create the exact folder structure from the project roadmap. Do not add UI. Keep secrets in .env.example only.
```

Prompt 2: database model

```text
Design the Prisma schema for contacts, leads, conversations/messages, webhook events, integration accounts, and audit logs. Add indexes for phone, providerMessageId, lead status, and createdAt. Generate migration instructions and explain the data relationships.
```

Prompt 3: WhatsApp webhook

```text
Implement WhatsApp Cloud API webhook support. Add GET verification using hub.mode, hub.verify_token, and hub.challenge. Add POST receiver using raw body, x-hub-signature-256 validation with META_APP_SECRET, safe JSON parsing, webhook event persistence, idempotency, and quick 200 response after accepted processing.
```

Prompt 4: lead creation flow

```text
Implement the inbound message flow: extract WhatsApp contact phone/name/message text, upsert Contact, create Lead when no open lead exists, save Message, save raw WebhookEvent, and return a structured service result. Add unit tests for new contact, existing contact, duplicate message, and invalid payload.
```

Prompt 5: outbound message

```text
Create a WhatsApp outbound message service using the Graph API and WA_PHONE_NUMBER_ID. Add POST /api/messages/send with validation, save outbound Message, call WhatsApp API, update providerMessageId/status, and return a clean response. Do not log access tokens.
```

Prompt 6: CRM adapter

```text
Create a CRM adapter interface with createLead, updateLeadStatus, addNote, and syncContact. Implement InternalCrmAdapter using the local database. Keep the adapter design ready for HubSpot, Zoho, Salesforce, Airtable, and Google Sheets without implementing those providers yet.
```

Prompt 7: production review

```text
Review the backend like a production lead. Check security, idempotency, secret leakage, error handling, webhook retries, database indexes, logging, test coverage, and deployment readiness. Return findings with file-level fixes and then apply the safe fixes.
```

## 12. Supporting Documents To Maintain

Create and maintain these documents in `/docs`:

- `01-product-scope.md`: what MVP includes and excludes
- `02-architecture.md`: system diagram and service responsibilities
- `03-api-contract.md`: endpoints, request/response examples
- `04-database-model.md`: tables, relationships, indexes
- `05-whatsapp-setup.md`: Meta app, webhook, token setup
- `06-deployment-runbook.md`: deploy, env vars, rollback
- `07-security-checklist.md`: token rotation, signature verification, PII handling
- `08-test-plan.md`: manual and automated QA checklist

## 13. Security Checklist

Critical rules:

- Never commit WhatsApp token, phone ID, app secret, or verify token.
- If a token was visible in a screen recording or shared code file, rotate it immediately.
- Store secrets in environment variables or secret manager.
- Verify `x-hub-signature-256` for every webhook POST.
- Use raw body for signature verification.
- Deduplicate webhook events.
- Log event IDs, not full customer PII.
- Protect admin APIs with authentication before production.
- Add rate limiting for public endpoints.
- Use HTTPS in staging and production.

## 14. Definition Of Done For MVP

MVP is complete when:

- Meta webhook verification succeeds.
- Incoming WhatsApp message creates or updates contact.
- New contact creates lead.
- Message is stored with direction `inbound`.
- Duplicate webhook does not create duplicate message.
- Admin can list leads.
- Backend can send one outbound WhatsApp text message.
- All required env vars are documented.
- App can be deployed and tested using a public HTTPS URL.
- Basic tests pass.

## 15. Future Roadmap

After MVP:

- Admin dashboard
- Team assignment
- Conversation inbox
- AI reply suggestions
- Lead pipeline board
- Tags and notes
- Template message management
- WhatsApp media handling
- HubSpot/Zoho/Salesforce sync
- Google Sheets export
- Multi-tenant organizations
- Role-based access control
- Analytics dashboard
- SLA and support ticketing

