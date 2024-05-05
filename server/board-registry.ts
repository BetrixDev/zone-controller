import five from "johnny-five";
import { db } from "./db";
import { boards, pins, zones } from "./schema";
import { eq, inArray } from "drizzle-orm";
import { env } from "./env";
import { hexToRgb } from "./utils";

// We are creating a BoardRegistry class since we need to store references to the board object
//  so we can link leds to them within johnny five

class BoardRegistry {
  private boards = new Map<string, five.Board>();

  async init() {
    const dbBoards = await db.query.boards.findMany();

    let boardsReadied = 0;

    if (!env.DETACHED) {
      dbBoards.forEach((board) => {
        const physicalBoard = new five.Board({
          id: board.id,
          port: board.port,
          repl: false,
          debug: false,
        });

        physicalBoard.on("ready", () => {
          boardsReadied++;

          if (boardsReadied === dbBoards.length) {
            this.onBoardsReady();
          }
        });

        this.boards.set(board.id, physicalBoard);
      });
    }
  }

  private async onBoardsReady() {
    const zones = await db.query.zones.findMany({
      where: (table, { eq }) => eq(table.enabled, true),
      with: { pins: true },
    });

    for (const zone of zones) {
      const board = this.getBoard(zone.boardId);

      if (!board) continue;

      if (zone.type === "white") {
        const whiteLed = new five.Led({
          pin: zone.pins[0].id,
          board,
          controller: zone.isPca9685 ? "PCA9685" : undefined,
          address: zone.isPca9685 ? zone.pcaAddress ?? undefined : undefined,
        });

        whiteLed.on();
        whiteLed.brightness(hexToRgb(zone.color).r);
      } else {
        const r = zone.pins.find(
          ({ associatedColor }) => associatedColor === "r",
        );
        const g = zone.pins.find(
          ({ associatedColor }) => associatedColor === "g",
        );
        const b = zone.pins.find(
          ({ associatedColor }) => associatedColor === "b",
        );

        if (!r || !g || !b) continue;

        const rgbLed = new five.Led.RGB({
          pins: [r.id, g.id, b.id],
          board,
          controller: zone.isPca9685 ? "PCA9685" : undefined,
          address: zone.isPca9685 ? zone.pcaAddress ?? undefined : undefined,
        } as any);

        rgbLed.on();
        rgbLed.color(zone.color);
      }
    }
  }

  async addNewBoard(id: string, port: string, displayName?: string) {
    await db.insert(boards).values({
      id: id,
      displayName: displayName ?? id,
      port: port,
    });

    if (!env.DETACHED) {
      const board = new five.Board({ id, port, repl: false, debug: false });

      board.on("ready", () => {
        this.boards.set(id, board);
      });
    }
  }

  async removeBoard(id: string) {
    const board = this.boards.get(id);

    if (!board) return;

    const relatedZones = await db.query.zones.findMany({
      where: (table, { eq }) => eq(table.boardId, id),
      with: { pins: true },
    });

    const relatedZoneIds = relatedZones.map(({ id }) => id);
    const relatedPins = relatedZones
      .flatMap((z) => z.pins)
      .map((pin) => new five.Led({ pin: pin.id, board }));

    relatedPins.forEach((led) => {
      led.brightness(0);
      led.off();
    });

    await db.batch([
      db.delete(pins).where(inArray(pins.zoneId, relatedZoneIds)),
      db.delete(zones).where(eq(zones.boardId, id)),
    ]);
  }

  getBoard(id: string) {
    return this.boards.get(id);
  }
}

export const boardRegistry = new BoardRegistry();
