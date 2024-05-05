import z from "zod";
import { db } from "server/db";
import { zones, pins } from "server/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { ActionFunctionArgs, json } from "@remix-run/node";
import { nanoid } from "nanoid";

export const addZoneSchema = z.object({
  displayName: z.string().min(1, "Display name must be atleast 1 character"),
  type: z.union([z.literal("white"), z.literal("rgb")]),
  pins: z.array(z.number()),
  controller: z.string(),
  address: z.number().optional(),
});

const addZoneRequestSchema = addZoneSchema.extend({
  boardId: z.string(),
});

export type AddZoneData = z.infer<typeof addZoneSchema>;

export const addZoneResolver = zodResolver(addZoneSchema);

export async function action({ request }: ActionFunctionArgs) {
  const data = addZoneRequestSchema.parse(await request.json());

  const isPca9685 = data.controller === "pca9685" && data.address !== undefined;

  const pinsInUse = await db.query.pins.findMany({
    where: (table, { inArray }) => inArray(table.id, data.pins),
    with: { zone: true },
  });

  const pinsInUseWithBoard = pinsInUse.filter((pin) => {
    let isConflicting = pin.zone.boardId === data.boardId;

    if (isPca9685) {
      if (pin.zone.pcaAddress !== data.address) {
        isConflicting = false;
      }
    }

    return isConflicting;
  });

  if (pinsInUseWithBoard.length > 0) {
    return json(
      {
        field: "pins",
        message: "Some pins selected are currently in use by other zones",
      },
      { status: 409 },
    );
  }

  const zoneId = nanoid(10);

  const [newZone] = await db
    .insert(zones)
    .values({
      boardId: data.boardId,
      id: zoneId,
      displayName: data.displayName,
      type: data.type,
      isPca9685,
      pcaAddress: isPca9685 ? data.address : undefined,
    })
    .returning();

  if (data.type === "white") {
    await db.insert(pins).values({
      id: data.pins[0],
      zoneId: newZone.id,
      associatedColor: "w",
    });
  } else {
    await db.batch([
      db.insert(pins).values({
        id: data.pins[0],
        zoneId: newZone.id,
        associatedColor: "r",
      }),
      db.insert(pins).values({
        id: data.pins[1],
        zoneId: newZone.id,
        associatedColor: "g",
      }),
      db.insert(pins).values({
        id: data.pins[2],
        zoneId: newZone.id,
        associatedColor: "b",
      }),
    ]);
  }

  return new Response(undefined, { status: 200 });
}
