# API Contract

## Endpoints

### `GET /health`
Health check.

**Response:** `{ "ok": true, "service": "crm-whatsapp-integration", "timestamp": "..." }`

---

### `GET /webhooks/whatsapp`
Meta webhook verification.

**Query Params:** `hub.mode`, `hub.verify_token`, `hub.challenge`

**Response:** Returns `hub.challenge` value with 200, or 403 if token mismatch.

---

### `POST /webhooks/whatsapp`
Receive inbound WhatsApp messages.

**Headers:** `x-hub-signature-256` (required)
**Body:** Raw JSON (Meta webhook payload)
**Response:** `200` on success, `401` on invalid signature.

---

### `POST /api/messages/send`
Send outbound WhatsApp text message.

**Body:**
```json
{ "to": "91xxxxxxxxxx", "text": "Hello from CRM" }
```

**Response:** `{ "ok": true, "data": { ...message } }`

---

### `GET /api/leads`
List leads. Optional query: `?status=new`

**Response:** `{ "ok": true, "data": [...leads] }`

---

### `GET /api/leads/:id`
Get single lead.

---

### `PATCH /api/leads/:id/status`
Update lead status.

**Body:** `{ "status": "contacted" }`

---

### `GET /api/messages/contacts/:id/messages`
Message history for a contact.
