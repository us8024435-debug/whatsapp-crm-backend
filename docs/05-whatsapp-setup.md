# WhatsApp Setup Guide

## Prerequisites

1. Meta Business Account
2. WhatsApp Business API access
3. A verified phone number

## Steps

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create or select an app → Business type
3. Add WhatsApp product to the app
4. Note down:
   - **Phone Number ID** → `WA_PHONE_NUMBER_ID`
   - **Temporary Access Token** → `WA_ACCESS_TOKEN`
   - **App Secret** (Settings → Basic) → `META_APP_SECRET`
5. Generate a random string → `WA_VERIFY_TOKEN`
6. Configure webhook:
   - Callback URL: `https://your-domain.com/webhooks/whatsapp`
   - Verify Token: same as `WA_VERIFY_TOKEN`
   - Subscribe to: `messages`

## Token Rotation

- Temporary tokens expire in 24 hours
- For production, create a System User and generate a permanent token
- Never commit tokens to git
