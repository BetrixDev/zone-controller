import { json } from "@remix-run/node";
import { boardRegistry } from "./board-registry";
import { env } from "./env";
import five from "johnny-five";

export const hexToRgb = (hex: string) => ({
  r: parseInt(hex.slice(1, 3), 16),
  g: parseInt(hex.slice(3, 5), 16),
  b: parseInt(hex.slice(5, 7), 16),
});

type ZoneData = {
  boardId: string;
  type: "white" | "rgb";
  color: string;
  isPca9685: boolean;
  pcaAddress: number | null;
  pins: { id: number; associatedColor: string }[];
};

export function updateZoneColor(zone: ZoneData) {
  if (!env.DETACHED) {
    const board = boardRegistry.getBoard(zone.boardId);

    if (!board) {
      return json({ message: "Unable to find board" }, { status: 400 });
    }

    if (zone.type === "rgb") {
      const r = zone.pins.find(
        ({ associatedColor }) => associatedColor === "r",
      );
      const g = zone.pins.find(
        ({ associatedColor }) => associatedColor === "r",
      );
      const b = zone.pins.find(
        ({ associatedColor }) => associatedColor === "r",
      );

      if (!r || !g || !b) {
        return new Response(undefined, { status: 400 });
      }

      const rgbLed = new five.Led.RGB({
        board,
        pins: [r.id, g.id, b.id],
        controller: zone.isPca9685 ? "PCA9685" : undefined,
        address: zone.isPca9685 ? zone.pcaAddress ?? undefined : undefined,
      } as any);

      rgbLed.on();
      rgbLed.color(zone.color);
    } else {
      const w = zone.pins[0];

      if (!w) {
        return new Response(undefined, { status: 400 });
      }

      const whiteLed = new five.Led({
        board,
        pin: w.id,
        controller: zone.isPca9685 ? "PCA9685" : undefined,
        address: zone.isPca9685 ? zone.pcaAddress ?? undefined : undefined,
      });

      const ledBrightness = hexToRgb(zone.color);

      console.log(ledBrightness);

      whiteLed.brightness(ledBrightness.r);
    }
  }
}
