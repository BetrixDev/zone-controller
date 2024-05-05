import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { db } from "server/db";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import AddBoardDialog from "~/components/dialogs/add-board-dialog";
import { useSetAtom } from "jotai";
import {
  addZoneDialogBoardIdAtom,
  deleteBoardDialogIdAtom,
  isAddBoardDialogOpenAtom,
  isCreatePresetDialogOpenAtom,
} from "~/atoms";
import { detectPorts } from "./api.detect-ports";
import AddZoneDialog from "~/components/dialogs/add-zone-dialog";
import DeleteZoneDialog from "~/components/dialogs/delete-zone-dialog";
import DeleteBoardDialog from "~/components/dialogs/delete-board-dialog";
import CreatePresetDialog from "~/components/dialogs/create-preset-dialog";
import DeletePresetDialog from "~/components/dialogs/delete-preset-dialog";
import PresetCard from "~/components/preset-card";
import ZoneCard from "~/components/zone-card";
import { Trash2 } from "lucide-react";

export async function loader() {
  const boards = await db.query.boards.findMany({
    with: { zones: { with: { pins: true } } },
  });

  const presets = await db.query.presets.findMany();

  const detectedBoards = await detectPorts();

  return json({ boards, presets, detectedBoards });
}

export default function Page() {
  const { boards, presets } = useLoaderData<typeof loader>();

  const setIsAddBoardDialogOpen = useSetAtom(isAddBoardDialogOpenAtom);
  const setAddZoneDialogBoardId = useSetAtom(addZoneDialogBoardIdAtom);
  const setDeleteBoardDialogId = useSetAtom(deleteBoardDialogIdAtom);
  const setIsCreatePresetDialogOpen = useSetAtom(isCreatePresetDialogOpenAtom);

  return (
    <>
      <AddZoneDialog />
      <AddBoardDialog />
      <DeleteZoneDialog />
      <DeleteBoardDialog />
      <CreatePresetDialog />
      <DeletePresetDialog />
      <div className="w-screen h-screen p-4 flex flex-col gap-4">
        <div className="w-full h-24 flex items-center px-8 justify-between">
          <h1 className="font-light text-3xl">Zone Controller</h1>
          <Button
            variant="outline"
            onClick={() => setIsAddBoardDialogOpen(true)}
          >
            Add a Board
          </Button>
        </div>
        <Card>
          <CardHeader className="flex-row justify-between items-center">
            <div className="flex flex-col gap-2">
              <CardTitle className="flex items-end gap-1">
                Presets{" "}
                <span className="text-muted-foreground font-normal text-sm leading-3 tracking-normal hidden md:block">
                  Clicking on a preset will update only the zones that the
                  preset has saved
                </span>
              </CardTitle>
              <div className="flex justify-between items-center">
                <div className="grow flex items-center gap-2 overflow-x-scroll">
                  {presets.map((preset) => (
                    <PresetCard key={preset.id} {...preset} />
                  ))}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsCreatePresetDialogOpen(true)}
            >
              Add a Preset
            </Button>
          </CardHeader>
        </Card>
        <div className="flex gap-4 flex-wrap overflow-auto">
          {boards.map((board) => (
            <Card key={board.id} className="basis-[30rem] grow max-w-[75rem]">
              <CardHeader className="flex flex-row justify-between items-center">
                <div className="space-y-1">
                  <CardTitle>{board.displayName}</CardTitle>
                  <CardDescription>{board.port}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setAddZoneDialogBoardId(board.id)}
                  >
                    Add a Zone
                  </Button>
                  <Button
                    className="w-10 p-2.5"
                    variant="destructive"
                    onClick={() => setDeleteBoardDialogId(board.id)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {board.zones.map((zone) => (
                  <ZoneCard key={zone.id} {...zone} />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
