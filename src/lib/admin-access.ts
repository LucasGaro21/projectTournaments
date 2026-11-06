import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { isUuid } from "@/lib/tournament/types";

/**
 * Admin access without an account.
 *
 * Creating a tournament yields a random token. The database keeps only its
 * SHA-256; the organizer keeps the token in an httpOnly cookie on this device
 * and in the admin link (/acceso/<id>?clave=<token>) to open it elsewhere.
 */

const COOKIE_NAME = "tp_admin";
const MAX_ENTRIES = 40;
const ONE_YEAR = 60 * 60 * 24 * 365;

type Entry = { i: string; t: string };

export function generateAdminToken(): string {
  return randomBytes(24).toString("base64url");
}

export function hashAdminToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function tokenMatches(token: string | null | undefined, hash: string | null): boolean {
  if (!token || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = Buffer.from(hashAdminToken(token), "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function decode(value: string | undefined): Entry[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    return Array.isArray(parsed)
      ? parsed.filter(
          (entry): entry is Entry =>
            typeof entry?.i === "string" && isUuid(entry.i) && typeof entry?.t === "string",
        )
      : [];
  } catch {
    return [];
  }
}

async function readEntries(): Promise<Entry[]> {
  const store = await cookies();
  return decode(store.get(COOKIE_NAME)?.value);
}

async function writeEntries(entries: Entry[]) {
  const store = await cookies();
  store.set(COOKIE_NAME, Buffer.from(JSON.stringify(entries)).toString("base64url"), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR,
  });
}

/** Tokens stored on this device, most recent first. */
export async function getStoredTokens(): Promise<Map<string, string>> {
  return new Map((await readEntries()).map((entry) => [entry.i, entry.t]));
}

export async function getStoredToken(tournamentId: string): Promise<string | null> {
  return (await getStoredTokens()).get(tournamentId) ?? null;
}

/** Only callable from Server Actions and Route Handlers. */
export async function rememberToken(tournamentId: string, token: string) {
  const entries = (await readEntries()).filter((entry) => entry.i !== tournamentId);
  await writeEntries([{ i: tournamentId, t: token }, ...entries].slice(0, MAX_ENTRIES));
}

export async function forgetToken(tournamentId: string) {
  await writeEntries((await readEntries()).filter((entry) => entry.i !== tournamentId));
}
