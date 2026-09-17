import { app } from "./app";
import { env } from "./config/env";
import pino from "pino";

const logger = pino({ name: "server" });
const port = Number(env.PORT);

app.listen(port, () => {
  logger.info({ port, env: env.NODE_ENV }, `🚀 CRM WhatsApp API listening on port ${port}`);
});

