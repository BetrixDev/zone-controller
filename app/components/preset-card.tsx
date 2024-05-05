import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { deletePresetDialogIdAtom } from "~/atoms";
import { useSetAtom } from "jotai";
import { Badge } from "./ui/badge";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "./ui/context-menu";

type Props = {
  displayName: string;
  id: string;
};

export default function PresetCard(props: Props) {
  const setDeletePresetDialogId = useSetAtom(deletePresetDialogIdAtom);

  const { mutate: loadPreset } = useMutation({
    mutationFn: async () => {
      await axios.post("/api/load-preset", { id: props.id });
    },
    onSuccess: () => {
      window.location.reload();
    },
  });

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <Badge
          variant="outline"
          className="hover:bg-secondary hover:cursor-pointer rounded-full text-nowrap"
          onClick={() => loadPreset()}
        >
          {props.displayName}
        </Badge>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuLabel className="bg-secondary/25 rounded-md">
          {props.displayName}
        </ContextMenuLabel>
        <ContextMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => setDeletePresetDialogId(props.id)}
        >
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
