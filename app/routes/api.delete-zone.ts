import { z } from "zod";
import { ActionFunctionArgs } from "@remix-run/node";
import { eq } from "drizzle-orm";
import { db } from "server/db";
import { pins, presetZones, zones } from "server/schema";

const schema = z.object({
  id: z.string(),
});

export async function action({ request }: ActionFunctionArgs) {
  const data = schema.parse(await request.json());

  await db.batch([
    db.delete(pins).where(eq(pins.zoneId, data.id)),
    db.delete(zones).where(eq(zones.id, data.id)),
    db.delete(presetZones).where(eq(presetZones.zoneId, data.id)),
  ]);

  return new Response(undefined, { status: 200 });
}
