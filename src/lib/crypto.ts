import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getAppSecret } from "./secrets";

export async function sign(data: string): Promise<string> {
  const secret = await getAppSecret();
  return createHmac("sha256", secret).update(data).digest("base64url");
}

export async function verifySignature(data: string, signature: string): Promise<boolean> {
  const expected = Buffer.from(await sign(data));
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
