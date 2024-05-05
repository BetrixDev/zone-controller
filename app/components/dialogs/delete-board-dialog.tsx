import { useLoaderData, useRevalidator } from "@remix-run/react";
import { useAtom } from "jotai";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { loader } from "~/routes/_index";
import { Button } from "../ui/button";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useMemo } from "react";
import { deleteBoardDialogIdAtom } from "~/atoms";

export default function DeleteBoardDialog() {
  const { boards } = useLoaderData<typeof loader>();

  const { revalidate } = useRevalidator();

  const [deleteBoardDialogId, setDeleteBoardDialogId] = useAtom(
    deleteBoardDialogIdAtom,
  );

  const { mutate: deleteZone } = useMutation({
    mutationFn: async () => {
      if (!deleteBoardDialogId) return;

      await axios.post("/api/delete-board", { id: deleteBoardDialogId });
    },
    onSettled: () => {
      revalidate();
      setDeleteBoardDialogId(undefined);
    },
  });

  const boardData = boards.find((board) => board.id === deleteBoardDialogId);

  if (!deleteBoardDialogId) return null;

  return (
    <Dialog
      open={deleteBoardDialogId !== undefined}
      onOpenChange={() => setDeleteBoardDialogId(undefined)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Confirm Deletion of {boardData?.displayName ?? "loading..."}
          </DialogTitle>
          {boardData && (
            <DialogDescription>
              {boardData.displayName} is associated with the following zones:{" "}
              {boardData.zones.map((z) => z.displayName).join(", ")}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="flex w-full gap-2">
          <Button
            className="grow"
            variant="secondary"
            onClick={() => setDeleteBoardDialogId(undefined)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="grow"
            onClick={() => deleteZone()}
          >
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
