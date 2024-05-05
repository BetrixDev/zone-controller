import axios, { AxiosError } from "axios";
import { useAtom } from "jotai";
import { addZoneDialogBoardIdAtom } from "~/atoms";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { type AddZoneData, addZoneResolver } from "~/routes/api.add-zone";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { useRevalidator } from "@remix-run/react";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from "../ui/select";

export default function AddZoneDialog() {
  const { revalidate } = useRevalidator();

  const [addZoneDialogBoardId, setAddZoneDialogBoardId] = useAtom(
    addZoneDialogBoardIdAtom,
  );

  const form = useForm<AddZoneData>({
    mode: "onSubmit",
    resolver: addZoneResolver,
    defaultValues: {
      type: "white",
      pins: [undefined, undefined, undefined],
      controller: "board",
      address: 0x40,
    },
  });

  const { mutate: onSubmit } = useMutation({
    mutationFn: async (data: AddZoneData) => {
      await axios.post("/api/add-zone", {
        ...data,
        boardId: addZoneDialogBoardId,
      });
    },
    onSuccess: () => {
      form.reset();
      setAddZoneDialogBoardId(undefined);
      revalidate();
    },
    onError: (err: AxiosError<{ message: string; field?: string }>) => {
      form.setError((err.response?.data.field as any) ?? "root", {
        message: err.response?.data.message,
      });
    },
  });

  if (addZoneDialogBoardId === undefined) return null;

  const zoneType = form.watch("type");
  const controllerType = form.watch("controller");

  return (
    <Dialog
      open={addZoneDialogBoardId !== undefined}
      onOpenChange={() => {
        setAddZoneDialogBoardId(undefined);
        form.reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a Zone</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit as any)}
            className="space-y-2"
          >
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
              name="controller"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Controller</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a controller for your zone" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="board">Main Board</SelectItem>
                      <SelectItem value="pca9685">PCA9685</SelectItem>
                    </SelectContent>
                    <FormMessage />
                  </Select>
                </FormItem>
              )}
            />
            {controllerType === "pca9685" && (
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PCA9865 Address</FormLabel>
                    <FormControl>
                      <Input
                        defaultValue={field.value}
                        placeholder="Select an address for the PCA9865"
                        onChange={(e) => {
                          if (isNaN(parseInt(e.currentTarget.value))) {
                            form.setError("address", {
                              message: "Address should evaluate to a number",
                            });
                          } else {
                            form.clearErrors("address");
                            form.setValue(
                              "address",
                              parseInt(e.currentTarget.value),
                            );
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zone Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex items-center justify-start gap-8"
                    >
                      <FormItem className="flex items-center space-x-1 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="white" />
                        </FormControl>
                        <FormLabel>White</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-1 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="rgb" />
                        </FormControl>
                        <FormLabel>RGB</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pins"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{zoneType === "white" ? "Pin" : "Pins"}</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      {zoneType === "white" && (
                        <Input
                          className="w-16 text-center"
                          pattern="^[0-9]*$"
                          defaultValue={field.value?.[0]}
                          onChange={(e) => {
                            form.setValue("pins", [+e.currentTarget.value]);
                          }}
                        />
                      )}
                      {zoneType === "rgb" && (
                        <>
                          <Input
                            placeholder="r"
                            className="w-16 text-center"
                            pattern="^[0-9]*$"
                            defaultValue={field.value?.[0]}
                            onChange={(e) => {
                              const pin = +e.currentTarget.value;
                              const currentPins = [...form.getValues("pins")];
                              currentPins[0] = pin;
                              form.setValue("pins", currentPins);
                            }}
                          />
                          <Input
                            placeholder="g"
                            className="w-16 text-center"
                            pattern="^[0-9]*$"
                            defaultValue={field.value?.[1]}
                            onChange={(e) => {
                              const pin = +e.currentTarget.value;
                              const currentPins = [...form.getValues("pins")];
                              currentPins[1] = pin;
                              form.setValue("pins", currentPins);
                            }}
                          />
                          <Input
                            placeholder="b"
                            className="w-16 text-center"
                            pattern="^[0-9]*$"
                            defaultValue={field.value?.[2]}
                            onChange={(e) => {
                              const pin = +e.currentTarget.value;
                              const currentPins = [...form.getValues("pins")];
                              currentPins[2] = pin;
                              form.setValue("pins", currentPins);
                            }}
                          />
                        </>
                      )}
                    </div>
                  </FormControl>
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
