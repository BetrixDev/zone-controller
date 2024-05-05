import { ActionFunctionArgs, json } from "@remix-run/node";
import { eq } from "drizzle-orm";
import { db } from "server/db";
import { zones } from "server/schema";
import { updateZoneColor } from "server/utils";
import { z } from "zod";

const loadPresetSchema = z.object({
  id: z.string(),
});

export type loadPresetRequest = z.infer<typeof loadPresetSchema>;

export async function action({ request }: ActionFunctionArgs) {
  const data = loadPresetSchema.parse(await request.json());

  const preset = await db.query.presets.findFirst({
    where: (table, { eq }) => eq(table.id, data.id),
    with: { presetZones: { with: { zone: { with: { pins: true } } } } },
  });

  if (!preset) {
    return json({ message: "Preset was not found" }, { status: 400 });
  }

  for (const presetZone of preset.presetZones) {
    updateZoneColor(presetZone.zone);
    await db
      .update(zones)
      .set({ color: presetZone.color })
      .where(eq(zones.id, presetZone.zoneId))
      .execute();
  }

  return new Response(undefined, { status: 200 });
}
