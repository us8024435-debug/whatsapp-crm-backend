import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("3000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string(),
  WA_VERIFY_TOKEN: z.string(),
  WA_ACCESS_TOKEN: z.string(),
  WA_PHONE_NUMBER_ID: z.string(),
  META_APP_SECRET: z.string(),
  FOUNDER_WHATSAPP: z.string().optional(),
  API_SECRET_KEY: z.string().default("dev-secret-key-change-in-production"),
  CRM_PROVIDER: z.enum(["internal", "hubspot", "zoho", "salesforce"]).default("internal"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
