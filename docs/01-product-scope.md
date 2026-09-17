# Product Scope

## What MVP Includes

- WhatsApp webhook verification (GET)
- Inbound message receiver with signature validation (POST)
- Raw webhook event storage for audit and replay
- Contact upsert by phone number
- Automatic lead creation for new contacts
- Message storage (inbound and outbound)
- Deduplication by provider message ID
- Outbound WhatsApp text messaging via Cloud API
- Admin API: list leads, view lead, update status, message history
- CRM adapter pattern (internal DB default, extensible to HubSpot/Zoho/Salesforce)

## What MVP Excludes

- Dashboard or frontend UI
- AI chatbot / auto-replies
- Campaign or broadcast messaging
- Template message management
- Media message handling (images, audio, video, documents)
- Multi-tenant / multi-organization support
- Role-based access control
- Payment flows
- Analytics / reporting dashboard
- SLA or ticketing
