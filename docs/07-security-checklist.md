# Security Checklist

## Critical Rules

- [ ] Never commit WhatsApp token, phone ID, app secret, or verify token
- [ ] If a token was visible in a screen recording or shared file, rotate immediately
- [ ] Store all secrets in environment variables or a secret manager
- [ ] Verify `x-hub-signature-256` for every webhook POST
- [ ] Use raw body (Buffer) for signature verification — not parsed JSON
- [ ] Deduplicate webhook events by providerEventId/providerMessageId
- [ ] Log event IDs only — never log full customer PII
- [ ] Protect admin APIs with authentication before going to production
- [ ] Add rate limiting for public endpoints
- [ ] Use HTTPS in staging and production
- [ ] Rotate temporary Meta tokens before they expire
- [ ] Use System User permanent tokens in production
