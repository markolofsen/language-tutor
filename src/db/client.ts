import "server-only";

import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { createClient } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

import * as schema from "./schema";

export type Db = LibSQLDatabase<typeof schema>;

let ready: Promise<Db> | undefined;

/**
 * One connection per process. `DATABASE_URL` is a libSQL URL: `libsql://…` (Turso) in production, or
 * `file:…` locally, which needs no server and is migrated here. A remote database is migrated by
 * `pnpm db:migrate` at build time, never from a request.
 */
export function getDb(): Promise<Db> {
  ready ??= open();
  return ready;
}

async function open(): Promise<Db> {
  if (process.env.VERCEL && !process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. A Vercel deployment needs a libSQL database (see README).");
  }
  const url = process.env.DATABASE_URL ?? `file:${resolve(/*turbopackIgnore: true*/ "data/english.db")}`;
  const local = url.startsWith("file:");
  if (local) mkdirSync(dirname(url.slice("file:".length)), { recursive: true });
  const authToken = process.env.DATABASE_AUTH_TOKEN;
  const client = createClient({ url, ...(authToken ? { authToken } : {}) });
  if (local) {
    await client.execute("PRAGMA journal_mode = WAL");
    await client.execute("PRAGMA foreign_keys = ON");
    await client.execute("PRAGMA busy_timeout = 5000");
  }
  const db = drizzle(client, { schema });
  if (local) await migrate(db, { migrationsFolder: resolve(/*turbopackIgnore: true*/ "drizzle") });
  return db;
}

/** What a query helper needs: satisfied by the connection and by a transaction. */
export type Executor = Pick<Db, "select" | "insert" | "update" | "delete">;
