import { ActionFunctionArgs, json } from "@remix-run/node";
import { eq } from "drizzle-orm";
import { db } from "server/db";
import { zones } from "server/schema";
import { z } from "zod";
import { updateZoneColor } from "server/utils";

const schema = z.object({
  zoneId: z.string(),
  hex: z.string(),
  isColor: z.boolean(),
});

export type SetZoneColorRequest = z.infer<typeof schema>;

export async function action({ request }: ActionFunctionArgs) {
  const data = schema.parse(await request.json());

  const zoneData = await db.query.zones.findFirst({
    where: (table, { eq }) => eq(table.id, data.zoneId),
    with: { pins: true },
  });

  if (!zoneData) {
    return json({ message: "Unable to find zone" }, { status: 400 });
  }

  await db
    .update(zones)
    .set({ color: data.hex })
    .where(eq(zones.id, data.zoneId));

  updateZoneColor({ ...zoneData, color: data.hex });

  return new Response(undefined, { status: 200 });
}
