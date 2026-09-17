# Architecture

## System Overview

Backend-first modular monolith with adapter pattern for CRM extensibility.

## Request Flow

1. WhatsApp User → Meta Cloud API → `POST /webhooks/whatsapp`
2. Signature validation → Raw event storage → Message parsing
3. Contact upsert → Lead creation → Message persistence
4. Admin API reads from PostgreSQL
5. Outbound messages go through `POST /api/messages/send` → Graph API

## Module Responsibilities

| Module | Responsibility |
|--------|---------------|
| `health` | Liveness check |
| `whatsapp` | Webhook verification, signature validation, message parsing, outbound API |
| `contacts` | Contact upsert and lookup |
| `leads` | Lead lifecycle management |
| `messages` | Message storage and history |
| `crm` | Adapter interface for swappable CRM backends |

## Tech Stack

- Node.js 20+ / TypeScript / Express.js
- PostgreSQL / Prisma ORM
- Zod validation / Pino logging
- Jest + Supertest for testing
