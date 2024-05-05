import { useLoaderData, useRevalidator } from "@remix-run/react";
import { useAtom } from "jotai";
import { deleteZoneDialogIdAtom } from "~/atoms";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { ZoneByIdRes } from "~/routes/api.zone-by-id.$zoneId";
import { loader } from "~/routes/_index";

export default function DeleteZoneDialog() {
  const { zones } = useLoaderData<typeof loader>();
  const { revalidate } = useRevalidator();

  const [deleteZoneDialogId, setDeleteZoneDialogId] = useAtom(
    deleteZoneDialogIdAtom,
  );

  const { mutate: deleteZone } = useMutation({
    mutationFn: async () => {
      if (!deleteZoneDialogId) return;

      await axios.post("/api/delete-zone", { id: deleteZoneDialogId });
    },
    onSettled: () => {
      revalidate();
      setDeleteZoneDialogId(undefined);
    },
  });

  const zoneData = zones.find((z) => z.id === deleteZoneDialogId);

  if (!deleteZoneDialogId) return null;

  return (
    <Dialog
      open={deleteZoneDialogId !== undefined}
      onOpenChange={() => setDeleteZoneDialogId(undefined)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Confirm Deletion of {zoneData?.displayName ?? "loading..."}
          </DialogTitle>
          {zoneData && (
            <DialogDescription>
              {zoneData.displayName} is connected to the following pins:{" "}
              {zoneData.pins.map((p) => p.id).join(", ")}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="flex w-full gap-2">
          <Button
            className="grow"
            variant="secondary"
            onClick={() => setDeleteZoneDialogId(undefined)}
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
