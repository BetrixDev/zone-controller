import { LoaderFunctionArgs } from "@remix-run/node";
import { db } from "server/db";

export async function loader({ params }: LoaderFunctionArgs) {
  const zoneId = params["zoneId"];

  if (!zoneId) {
    return new Response(undefined, { status: 400 });
  }

  return db.query.zones.findFirst({
    where: (table, { eq }) => eq(table.id, zoneId),
    with: { board: true, pins: true },
  });
}

export type ZoneByIdRes = {
  id: string;
  displayName: string;
  boardId: string;
  type: "white" | "rgb";
  enabled: boolean;
  board: {
    id: string;
    displayName: string;
    port: string;
  };
  pins: {
    zoneId: string;
    id: number;
    brightness: number;
  }[];
};
