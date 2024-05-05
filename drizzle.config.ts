import { Config } from "drizzle-kit";

export default {
  schema: "./server/schema.ts",
  out: "./server/migrations",
} satisfies Config;
