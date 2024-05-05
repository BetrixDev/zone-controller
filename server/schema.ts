import { relations } from "drizzle-orm";
import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const boards = sqliteTable("boards", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull(),
  port: text("port").notNull(),
});

export const zones = sqliteTable("zones", {
  id: text("id").primaryKey(),
  boardId: text("board_id").notNull(),
  displayName: text("display_name").notNull(),
  type: text("type", { enum: ["white", "rgb"] })
    .notNull()
    .default("white"),
  isPca9685: integer("is_pca9685", { mode: "boolean" })
    .notNull()
    .default(false),
  pcaAddress: integer("pca_address"),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  color: text("color").notNull().default("#FFFFFF"),
});

export const pins = sqliteTable(
  "pins",
  {
    id: integer("id").notNull(),
    zoneId: text("zone_id").notNull(),
    associatedColor: text("associated_color").notNull(),
  },
  (table) => ({
    pin_pk: primaryKey({ columns: [table.id, table.zoneId] }),
  }),
);

export const presets = sqliteTable("presets", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull(),
});

export const presetZones = sqliteTable(
  "preset_zones",
  {
    zoneId: text("zone_id").notNull(),
    presetId: text("preset_id").notNull(),
    color: text("color").notNull(),
  },
  (table) => ({
    preset_pk: primaryKey({ columns: [table.zoneId, table.presetId] }),
  }),
);

export const boardsRelations = relations(boards, ({ many }) => ({
  zones: many(zones),
}));

export const zonesRelations = relations(zones, ({ one, many }) => ({
  board: one(boards, {
    fields: [zones.boardId],
    references: [boards.id],
  }),
  pins: many(pins),
}));

export const pinsRelations = relations(pins, ({ one }) => ({
  zone: one(zones, {
    fields: [pins.zoneId],
    references: [zones.id],
  }),
}));

export const presetsRelations = relations(presets, ({ many }) => ({
  presetZones: many(presetZones),
}));

export const presetZonesRelations = relations(presetZones, ({ one }) => ({
  preset: one(presets, {
    fields: [presetZones.presetId],
    references: [presets.id],
  }),
  zone: one(zones, {
    fields: [presetZones.zoneId],
    references: [zones.id],
  }),
}));
