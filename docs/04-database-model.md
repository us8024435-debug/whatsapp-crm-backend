# Database Model

## Tables

### Contact
| Column | Type | Notes |
|--------|------|-------|
| id | cuid | Primary key |
| phone | string | Unique, indexed |
| name | string? | WhatsApp profile name |
| source | string | Default: "whatsapp" |
| createdAt | datetime | Indexed |
| updatedAt | datetime | Auto-updated |

### Lead
| Column | Type | Notes |
|--------|------|-------|
| id | cuid | Primary key |
| contactId | string | FK → Contact |
| status | string | Default: "new", indexed |
| source | string | Default: "whatsapp" |
| title | string? | |
| notes | string? | |
| createdAt | datetime | Indexed |
| updatedAt | datetime | Auto-updated |

### Message
| Column | Type | Notes |
|--------|------|-------|
| id | cuid | Primary key |
| providerMessageId | string? | Unique (dedup key) |
| contactId | string | FK → Contact, indexed |
| direction | string | "inbound" or "outbound" |
| type | string | "text", "image", etc. |
| text | string? | Message body |
| status | string? | "received", "sent", etc. |
| rawPayload | json? | Original webhook data |
| createdAt | datetime | Indexed |

### WebhookEvent
| Column | Type | Notes |
|--------|------|-------|
| id | cuid | Primary key |
| providerEventId | string? | Unique (dedup key) |
| source | string | "whatsapp" |
| eventType | string? | |
| payload | json | Full raw payload |
| processedAt | datetime? | |
| createdAt | datetime | Indexed |
