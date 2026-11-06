import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";

/**
 * Salted hash of the client IP, used only to rate-limit anonymous tournament
 * creation. The raw IP is never stored.
 */
export async function getClientIpHash(): Promise<string | null> {
  const list = await headers();
  const ip =
    list.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    list.get("x-real-ip")?.trim() ||
    null;

  if (!ip) return null;

  const salt = process.env.IP_HASH_SALT ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "torneospro";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}
