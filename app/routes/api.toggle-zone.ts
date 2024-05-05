import { ActionFunctionArgs } from "@remix-run/node";
import { ConsoleLogWriter, eq } from "drizzle-orm";
import { db } from "server/db";
import { zones } from "server/schema";
import { updateZoneColor } from "server/utils";
import { z, ZodError } from "zod";

const toggleZoneRequest = z.object({
  id: z.string(),
  enabled: z.boolean(),
});

export async function action({ request }: ActionFunctionArgs) {
  try {
    const data = toggleZoneRequest.parse(await request.json());

    await db.transaction(async (tx) => {
      const zoneData = await tx.query.zones.findFirst({
        where: (table, { eq }) => eq(table.id, data.id),
        with: { pins: true },
      });

      if (!zoneData) return new Response(undefined, { status: 400 });

      await tx
        .update(zones)
        .set({ enabled: data.enabled })
        .where(eq(zones.id, data.id));

      if (data.enabled) {
        updateZoneColor(zoneData);
      } else {
        updateZoneColor({
          ...zoneData,
          color: "#000000",
        });
      }
    });

    return new Response(undefined, { status: 200 });
  } catch (e: unknown) {
    console.log(e);
    if (e instanceof ZodError) {
      return new Response(undefined, { status: 400 });
    } else {
      return new Response(undefined, { status: 500 });
    }
  }
}
