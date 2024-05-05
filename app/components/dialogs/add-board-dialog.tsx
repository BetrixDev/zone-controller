import axios, { AxiosError } from "axios";
import { useAtom } from "jotai";
import { isAddBoardDialogOpenAtom } from "~/atoms";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { type AddBoardData, addBoardResolver } from "~/routes/api.add-board";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger } from "../ui/select";
import { DetectPortsResponse } from "~/routes/api.detect-ports";
import { SelectValue } from "@radix-ui/react-select";
import { RefreshCcw } from "lucide-react";
import { useForm } from "react-hook-form";
import { useLoaderData, useRevalidator } from "@remix-run/react";
import type { loader } from "~/routes/_index";

export default function AddBoardDialog() {
  const { detectedBoards } = useLoaderData<typeof loader>();
  const { revalidate } = useRevalidator();

  const [isAddBoardDialogOpen, setIsAddBoardDialogOpen] = useAtom(
    isAddBoardDialogOpenAtom,
  );

  const form = useForm<AddBoardData>({
    mode: "onSubmit",
    resolver: addBoardResolver,
  });

  const { mutate: onSubmit } = useMutation({
    mutationFn: async (data: AddBoardData) => {
      await axios.post("/api/add-board", data);
    },
    onSuccess: () => {
      setIsAddBoardDialogOpen(false);
      form.reset();
      revalidate();
    },
    onError: (err: AxiosError<{ message: string; field?: string }>) => {
      form.setError((err.response?.data.field as any) ?? "root", {
        message: err.response?.data.message,
      });
    },
  });

  const {
    data: detectedPorts,
    refetch: refetchDetectedPorts,
    isLoading: isDetectedPortsLoading,
  } = useQuery({
    initialData: detectedBoards,
    queryKey: ["autoDetect"],
    queryFn: async () => {
      const res = await axios.get<DetectPortsResponse>("/api/detect-ports");
      return res.data;
    },
    enabled: false,
  });

  if (!isAddBoardDialogOpen) return null;

  return (
    <Dialog
      open={isAddBoardDialogOpen}
      onOpenChange={(o) => {
        setIsAddBoardDialogOpen(o);
        form.reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a Board</DialogTitle>
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
              name="port"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specify a Port</FormLabel>
                  <div className="flex gap-2">
                    <Select
                      disabled={
                        detectedPorts === undefined || isDetectedPortsLoading
                      }
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a serial port the board is on" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {detectedPorts &&
                          detectedPorts.map(({ manufacturer, path }) => (
                            <SelectItem key={path} value={path}>
                              {path} {manufacturer && `(${manufacturer})`}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="secondary"
                      type="button"
                      className="p-2 aspect-square"
                      onClick={() => refetchDetectedPorts()}
                    >
                      <RefreshCcw />
                    </Button>
                  </div>
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
