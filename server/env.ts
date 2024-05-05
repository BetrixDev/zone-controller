import { z } from "zod";

const envSchema = z.object({
  /** Useful for development without needing to have a valid board plugged into a port */
  DETACHED: z.coerce.boolean(),
});

export const env = envSchema.parse(process.env);
