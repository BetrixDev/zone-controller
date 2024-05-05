import { ActionFunctionArgs } from "@remix-run/node";
import { eq } from "drizzle-orm";
import { db } from "server/db";
import { presets, presetZones } from "server/schema";
import { z } from "zod";

const deletePresetSchema = z.object({
  id: z.string(),
});

export type DeletePresetRequest = z.infer<typeof deletePresetSchema>;

export async function action({ request }: ActionFunctionArgs) {
  const data = deletePresetSchema.parse(await request.json());

  await db.batch([
    db.delete(presetZones).where(eq(presetZones.presetId, data.id)),
    db.delete(presets).where(eq(presets.id, data.id)),
  ]);

  return new Response(undefined, { status: 200 });
}
