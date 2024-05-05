import { useRevalidator } from "@remix-run/react";
import { useAtom } from "jotai";
import { deletePresetDialogIdAtom } from "~/atoms";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";

export default function DeletePresetDialog() {
  const { revalidate } = useRevalidator();

  const [deletePresetDialogId, setPresetZoneDialogId] = useAtom(
    deletePresetDialogIdAtom,
  );

  const { mutate: deletePreset } = useMutation({
    mutationFn: async () => {
      if (!deletePresetDialogId) return;

      await axios.post("/api/delete-preset", { id: deletePresetDialogId });
    },
    onSettled: () => {
      revalidate();
      setPresetZoneDialogId(undefined);
    },
  });

  const { data: presetData } = useQuery({
    queryKey: ["presetById", deletePresetDialogId],
    queryFn: async () => {
      if (!deletePresetDialogId) return;

      const res = await axios.get<{ displayName: string }>(
        `/api/preset-by-id/${deletePresetDialogId}`,
      );

      return res.data;
    },
    enabled: deletePresetDialogId !== undefined,
  });

  if (!deletePresetDialogId) return null;

  return (
    <Dialog
      open={deletePresetDialogId !== undefined}
      onOpenChange={() => setPresetZoneDialogId(undefined)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Confirm Deletion of {presetData?.displayName ?? "loading..."}
          </DialogTitle>
        </DialogHeader>
        <div className="flex w-full gap-2">
          <Button
            className="grow"
            variant="secondary"
            onClick={() => setPresetZoneDialogId(undefined)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="grow"
            onClick={() => deletePreset()}
          >
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
