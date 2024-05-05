import { ActionFunctionArgs } from "@remix-run/node";
import { eq, inArray } from "drizzle-orm";
import { db } from "server/db";
import { boards, pins, zones } from "server/schema";
import { z } from "zod";

const schema = z.object({
  id: z.string(),
});

export async function action({ request }: ActionFunctionArgs) {
  const data = schema.parse(await request.json());

  const relatedZones = await db.query.zones.findMany({
    where: (table, { eq }) => eq(table.boardId, data.id),
  });

  const relatedZoneIds = relatedZones.map((z) => z.id);

  await db.batch([
    db
      .delete(pins)
      .where(inArray(pins.zoneId as any, [...relatedZoneIds, null])),
    db.delete(zones).where(eq(zones.boardId, data.id)),
    db.delete(boards).where(eq(boards.id, data.id)),
  ]);

  return new Response(undefined, { status: 200 });
}
