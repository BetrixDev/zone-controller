import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { useRevalidator } from "@remix-run/react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Trash2 } from "lucide-react";
import { Slider } from "./ui/slider";
import { Switch } from "./ui/switch";
import { useSetAtom } from "jotai";
import { deleteZoneDialogIdAtom } from "~/atoms";
import { SetZoneColorRequest } from "~/routes/api.set-zone-color";
import { useDebounceValue } from "usehooks-ts";

const rgbToHex = (r: number, g: number, b: number) => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

const hexToRgb = (hex: string) => ({
  r: parseInt(hex.slice(1, 3), 16),
  g: parseInt(hex.slice(3, 5), 16),
  b: parseInt(hex.slice(5, 7), 16),
});

type ZoneCardProps = {
  type: "white" | "rgb";
  displayName: string;
  enabled: boolean;
  id: string;
  boardId: string;
  isPca9685: boolean;
  pcaAddress: number | null;
  color: string;
  pins: {
    id: number;
    zoneId: string;
    associatedColor: string;
  }[];
};

export default function ZoneCard(props: ZoneCardProps) {
  const { revalidate } = useRevalidator();

  const setDeleteZoneDialogId = useSetAtom(deleteZoneDialogIdAtom);

  const [zoneEnabled, setZoneEnabled] = useState(props.enabled);

  const { mutate: toggleZone } = useMutation({
    mutationFn: async () => {
      setZoneEnabled((c) => !c);
      await axios.post("/api/toggle-zone", {
        id: props.id,
        enabled: !zoneEnabled,
      });
    },
    onError: () => {
      revalidate();
    },
  });

  const { mutate: setZoneColor } = useMutation({
    mutationFn: async (hex: string) => {
      return await axios.post("api/set-zone-color", {
        hex: hex,
        zoneId: props.id,
        isColor: props.type === "rgb",
      } as SetZoneColorRequest);
    },
    onError: () => {
      revalidate();
    },
  });

  return (
    <Card>
      <CardHeader className="p-4 pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-end gap-2">
            {props.displayName}{" "}
            {props.isPca9685 && (
              <span className="text-sm text-muted-foreground font-light hidden sm:block">
                PCA9685 0X
                {props.pcaAddress?.toString(16)}{" "}
              </span>
            )}
            <span className="text-sm text-muted-foreground font-light hidden sm:block">
              [{props.pins.map((p) => p.id).join(", ")}]
            </span>
          </div>
          <div className="flex gap-4 items-center">
            <div className="flex gap-2">
              <p>Enabled</p>
              <Switch
                onCheckedChange={() => toggleZone()}
                checked={zoneEnabled}
              />
            </div>
            <div className="flex gap-2 items-center">
              <Button
                size="sm"
                className="w-9 p-2"
                variant="destructive"
                onClick={() => setDeleteZoneDialogId(props.id)}
              >
                <Trash2 />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        {props.type === "white" && (
          <WhiteZoneSlider
            {...props.pins[0]}
            zoneColor={props.color}
            setZoneColor={setZoneColor}
          />
        )}
        {props.type === "rgb" && (
          <ColorZonePicker {...props} setZoneColor={setZoneColor} />
        )}
      </CardContent>
    </Card>
  );
}

function WhiteZoneSlider(props: {
  id: number;
  zoneId: string;
  zoneColor: string;
  setZoneColor: (hex: string) => void;
}) {
  const [displayBrightness, setDisplayBrightness] = useState(
    hexToRgb(props.zoneColor).r,
  );

  const [debounced, setDebounced] = useDebounceValue<undefined | number>(
    undefined,
    250,
  );

  useEffect(() => {
    if (debounced === undefined || isNaN(debounced)) return;

    const hexString = rgbToHex(debounced, debounced, debounced);
    props.setZoneColor(hexString);
  }, [debounced]);

  function onChange(input: number | string) {
    const value = Number(input);

    if (isNaN(value)) {
      setDebounced(100);
      setDisplayBrightness(100);
    } else if (value < 0) {
      setDebounced(0);
      setDisplayBrightness(0);
    } else if (value > 255) {
      setDebounced(255);
      setDisplayBrightness(255);
    } else {
      setDebounced(value);
      setDisplayBrightness(value);
    }
  }

  return (
    <div className="flex gap-2">
      <Slider
        className="grow"
        value={[displayBrightness]}
        min={0}
        max={255}
        step={1}
        onValueChange={([e]) => onChange(e)}
      />
      <Input
        className="w-16 text-center"
        onChange={(e) => onChange(e.currentTarget.value)}
        value={displayBrightness}
      />
    </div>
  );
}

function ColorZonePicker(
  props: ZoneCardProps & { setZoneColor: (hex: string) => void },
) {
  const [debounced, setDebounced] = useDebounceValue(props.color, 100);

  useEffect(() => {
    if (debounced === props.color) return;

    props.setZoneColor(debounced);
  }, [debounced]);

  return (
    <Input
      type="color"
      className="p-0"
      defaultValue={props.color}
      onChange={(e) => setDebounced(e.currentTarget.value)}
    />
  );
}
