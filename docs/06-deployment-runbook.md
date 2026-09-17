# Deployment Runbook

## Local Development

```bash
# 1. Copy env and fill in real values
cp .env.example .env

# 2. Start PostgreSQL (Docker or local)
docker run -d --name crm-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=crm_whatsapp -p 5432:5432 postgres:16

# 3. Run migrations
npm run db:migrate

# 4. Start dev server
npm run dev

# 5. Expose locally via ngrok
ngrok http 3000
```

## Staging / Production

1. Choose hosting: Render, Railway, Fly.io, or VPS
2. Set all environment variables from `.env.example`
3. Ensure PostgreSQL is provisioned
4. Run `npx prisma migrate deploy`
5. Start with `npm start`
6. Configure Meta webhook to point to `https://your-domain/webhooks/whatsapp`

## Rollback

1. Check logs for the failing migration
2. Run `npx prisma migrate resolve --rolled-back <migration_name>`
3. Deploy previous working code
