import { json, LoaderFunctionArgs } from "@remix-run/node";
import { db } from "server/db";

export async function loader({ params }: LoaderFunctionArgs) {
  const presetId = params["presetId"];

  if (!presetId) return new Response(undefined, { status: 400 });

  const presetData = await db.query.presets.findFirst({
    where: (table, { eq }) => eq(table.id, presetId),
  });

  return json(presetData);
}
