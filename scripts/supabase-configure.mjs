#!/usr/bin/env node
/**
 * Configures Supabase Auth for this app through the Management API:
 * site URL and allowed redirect URLs (needed for e-mail confirmation and
 * password recovery links).
 *
 *   npm run supabase:configure
 *
 * Needs, in the environment or .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL   https://<ref>.supabase.co
 *   NEXT_PUBLIC_SITE_URL       https://tu-dominio.com
 *   SUPABASE_ACCESS_TOKEN      personal token from supabase.com/dashboard/account/tokens
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");

try {
  const content = await readFile(path.join(root, ".env.local"), "utf8");
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
} catch {
  // optional
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = supabaseUrl?.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1];

if (!ref || !siteUrl || !token) {
  console.error(
    "Faltan variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SITE_URL y SUPABASE_ACCESS_TOKEN.",
  );
  process.exit(1);
}

const redirects = [
  `${siteUrl}/auth/callback`,
  `${siteUrl}/**`,
  "http://localhost:3000/auth/callback",
  "http://localhost:3000/**",
];

const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    site_url: siteUrl,
    uri_allow_list: redirects.join(","),
    password_min_length: 8,
  }),
});

if (!response.ok) {
  console.error(`Supabase respondió ${response.status}:`, await response.text());
  process.exit(1);
}

console.log("Auth configurado:");
console.log(`  Site URL: ${siteUrl}`);
console.log(`  Redirect URLs: ${redirects.join(", ")}`);
