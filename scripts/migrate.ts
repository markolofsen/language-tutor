// Applies drizzle/ migrations to DATABASE_URL (a remote libSQL database). Run at build time: `pnpm db:migrate`.
import { resolve } from "node:path";

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

const url = process.env.DATABASE_URL;
if (!url) {
  console.log("DATABASE_URL is not set: nothing to migrate.");
  process.exit(0);
}
const authToken = process.env.DATABASE_AUTH_TOKEN;
const db = drizzle(createClient({ url, ...(authToken ? { authToken } : {}) }));
await migrate(db, { migrationsFolder: resolve("drizzle") });
console.log("Migrations applied.");
