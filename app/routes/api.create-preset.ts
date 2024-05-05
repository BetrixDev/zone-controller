import { zodResolver } from "@hookform/resolvers/zod";
import { ActionFunctionArgs, json } from "@remix-run/node";
import { nanoid } from "nanoid";
import { db } from "server/db";
import { presets, presetZones } from "server/schema";
import { z } from "zod";

const createPresetSchema = z.object({
  displayName: z.string().min(1),
  specificZones: z.array(z.string()).optional(),
});

export type CreatePresetRequest = z.infer<typeof createPresetSchema>;

export const createPresetResolver = zodResolver(createPresetSchema);

export async function action({ request }: ActionFunctionArgs) {
  const data = createPresetSchema.parse(await request.json());

  const existingPresetWithName = await db.query.presets.findFirst({
    where: (table, { eq }) => eq(table.displayName, data.displayName),
  });

  if (existingPresetWithName) {
    return json(
      {
        field: "displayName",
        message: "A preset with that name already exists",
      },
      { status: 400 },
    );
  }

  const zonesStates = await db.query.zones.findMany({
    where:
      data.specificZones && data.specificZones.length > 0
        ? (table, { inArray }) => inArray(table.id, data.specificZones ?? [])
        : undefined,
  });

  if (zonesStates.length === 0) {
    return json(
      {
        field: "specificZones",
        message: "No zones were found to apply the preset to",
      },
      { status: 400 },
    );
  }

  const presetId = nanoid(15);

  await db.batch([
    db.insert(presets).values({ displayName: data.displayName, id: presetId }),
    db.insert(presetZones).values(
      zonesStates.map((zone) => ({
        presetId,
        zoneId: zone.id,
        color: zone.color,
      })),
    ),
  ]);

  return new Response(undefined, { status: 200 });
}
