import z from "zod";
import { db } from "server/db";
import { zodResolver } from "@hookform/resolvers/zod";
import { ActionFunctionArgs, json } from "@remix-run/node";
import { boardRegistry } from "server/board-registry";
import { nanoid } from "nanoid";

export const addBoardSchema = z.object({
  displayName: z.string().min(1, "Display name must be atleast 1 character"),
  port: z.string(),
});

export type AddBoardData = z.infer<typeof addBoardSchema>;

export const addBoardResolver = zodResolver(addBoardSchema);

export async function action({ request }: ActionFunctionArgs) {
  const data = addBoardSchema.parse(await request.json());

  const existingBoardByPort = await db.query.boards.findFirst({
    where: (table, { eq }) => eq(table.port, data.port),
  });

  if (existingBoardByPort) {
    return json(
      {
        field: "port",
        message: "There is a board already using the specified port",
      },
      { status: 409 },
    );
  }

  const boardId = nanoid(10);

  await boardRegistry.addNewBoard(boardId, data.port, data.displayName);

  return new Response(undefined, { status: 200 });
}
