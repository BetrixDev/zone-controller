import path from "path";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import * as schema from "./schema";

const client = createClient({ url: "file:zone.db" });

export const db = drizzle(client, { schema });

export async function runMigrations() {
  await migrate(db, {
    migrationsFolder: path.join(process.cwd(), "server", "migrations"),
  });
}
