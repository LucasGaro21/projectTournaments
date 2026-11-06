#!/usr/bin/env node
/**
 * Applies supabase/migrations/*.sql in order, once each, inside a transaction.
 *
 *   npm run db:migrate            # applies pending migrations
 *   npm run db:migrate -- --status  # lists applied / pending
 *
 * Needs SUPABASE_DB_URL (Supabase → Project Settings → Database → Connection
 * string → URI, "Session pooler" works everywhere). Read from the environment
 * or from .env.local.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const root = path.resolve(import.meta.dirname, "..");
const migrationsDir = path.join(root, "supabase", "migrations");

async function loadEnvFile() {
  try {
    const content = await readFile(path.join(root, ".env.local"), "utf8");
    for (const line of content.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!match || process.env[match[1]]) continue;
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    // .env.local is optional when the variable is already exported.
  }
}

await loadEnvFile();

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  console.error("Falta SUPABASE_DB_URL (en el entorno o en .env.local).");
  process.exit(1);
}

const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(connectionString);
const client = new pg.Client({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

await client.connect();

try {
  await client.query(`
    create table if not exists public.app_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    );
    alter table public.app_migrations enable row level security;
  `);

  const files = (await readdir(migrationsDir)).filter((file) => file.endsWith(".sql")).sort();
  const { rows } = await client.query("select name from public.app_migrations");
  const applied = new Set(rows.map((row) => row.name));
  const pending = files.filter((file) => !applied.has(file));

  if (process.argv.includes("--status")) {
    for (const file of files) console.log(`${applied.has(file) ? "✔" : "·"} ${file}`);
    process.exit(0);
  }

  if (pending.length === 0) {
    console.log("La base de datos está al día.");
  }

  for (const file of pending) {
    const sql = await readFile(path.join(migrationsDir, file), "utf8");
    process.stdout.write(`→ ${file} … `);

    try {
      await client.query("begin");
      await client.query(sql);
      await client.query("insert into public.app_migrations (name) values ($1)", [file]);
      await client.query("commit");
      console.log("ok");
    } catch (error) {
      await client.query("rollback");
      console.log("ERROR");
      console.error(error.message);
      process.exit(1);
    }
  }
} finally {
  await client.end();
}
