import crypto from "crypto";

/**
 * Validates the x-hub-signature-256 header from Meta's webhook POST.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function isValidMetaSignature(rawBody: Buffer | undefined, signature: string | undefined): boolean {
  const appSecret = process.env.META_APP_SECRET;

  if (!appSecret || !signature || !rawBody || !Buffer.isBuffer(rawBody)) {
    return false;
  }

  if (!signature.startsWith("sha256=")) {
    return false;
  }

  const expected =
    "sha256=" +
    crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");

  const expectedBuffer = Buffer.from(expected, "utf8");
  const signatureBuffer = Buffer.from(signature, "utf8");

  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}
