import { z } from "zod";
import { ActionFunctionArgs } from "@remix-run/node";
import { eq } from "drizzle-orm";
import { db } from "server/db";
import { pins, presetZones, zones } from "server/schema";
import { updateZoneColor } from "server/utils";

const schema = z.object({
  id: z.string(),
});

export async function action({ request }: ActionFunctionArgs) {
  const data = schema.parse(await request.json());

  const zoneData = await db.query.zones.findFirst({
    where: (table, { eq }) => eq(table.id, data.id),
    with: { pins: true },
  });

  if (!zoneData) return new Response(undefined, { status: 400 });

  updateZoneColor({
    ...zoneData,
    color: "#000000",
  });

  await db.batch([
    db.delete(pins).where(eq(pins.zoneId, data.id)),
    db.delete(zones).where(eq(zones.id, data.id)),
    db.delete(presetZones).where(eq(presetZones.zoneId, data.id)),
  ]);

  return new Response(undefined, { status: 200 });
}
