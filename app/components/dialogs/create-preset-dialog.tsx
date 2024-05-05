import { useAtom } from "jotai";
import axios, { AxiosError } from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { isCreatePresetDialogOpenAtom } from "~/atoms";
import { useForm } from "react-hook-form";
import {
  CreatePresetRequest,
  createPresetResolver,
} from "~/routes/api.create-preset";
import { useMutation } from "@tanstack/react-query";
import { useLoaderData, useRevalidator } from "@remix-run/react";
import { loader } from "~/routes/_index";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";

export default function CreatePresetDialog() {
  const { zones } = useLoaderData<typeof loader>();
  const { revalidate } = useRevalidator();

  const [isCreatePresetDialogOpen, setIsCreatePresetDialogOpen] = useAtom(
    isCreatePresetDialogOpenAtom,
  );

  const form = useForm<CreatePresetRequest>({
    mode: "onSubmit",
    resolver: createPresetResolver,
  });

  const { mutate: onSubmit } = useMutation({
    mutationFn: async (data: CreatePresetRequest) => {
      await axios.post("/api/create-preset", data);
    },
    onSuccess: () => {
      setIsCreatePresetDialogOpen(false);
      form.reset();
      revalidate();
    },
    onError: (err: AxiosError<{ message: string; field?: string }>) => {
      form.setError((err.response?.data.field as any) ?? "root", {
        message: err.response?.data.message,
      });
    },
  });

  if (!isCreatePresetDialogOpen) return null;

  const specificZones = form.watch("specificZones");

  function onDropdownCheckedChanged(checked: boolean, zoneId: string) {
    if (checked) {
      if (specificZones === undefined) {
        form.setValue("specificZones", [zoneId]);
      } else {
        form.setValue("specificZones", [...specificZones, zoneId]);
      }
    } else {
      if (specificZones !== undefined) {
        form.setValue(
          "specificZones",
          specificZones.filter((z) => z !== zoneId),
        );
      }
    }
  }

  return (
    <Dialog
      open={isCreatePresetDialogOpen}
      onOpenChange={(o) => {
        setIsCreatePresetDialogOpen(o);
        form.reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a Preset</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit as any)}
            className="space-y-2"
          >
            <FormMessage />
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="specificZones"
              render={() => (
                <FormItem>
                  <FormLabel>Save Specific Zones</FormLabel>
                  <FormControl>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button className="w-full" variant="secondary">
                          Select Zones
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="min-w-48">
                        {zones.map((zone) => (
                          <DropdownMenuCheckboxItem
                            key={zone.id}
                            checked={specificZones?.includes(zone.id)}
                            onSelect={(e) => e.preventDefault()}
                            onCheckedChange={(checked) =>
                              onDropdownCheckedChanged(checked, zone.id)
                            }
                          >
                            {zone.displayName}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </FormControl>
                  {specificZones === undefined ||
                  specificZones.length === 0 ||
                  specificZones.length === zones.length ? (
                    <p className="text-sm text-muted-foreground">
                      Saving all zones
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Saving {specificZones.length} zone
                      {specificZones.length === 1 ? "" : "s"}
                    </p>
                  )}

                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Submit
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
