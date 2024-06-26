import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { type AppLoadContext, type ServerBuild } from "@remix-run/node";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { remix } from "remix-hono/handler";
import { cache } from "server/middlewares";
import { importDevBuild } from "./dev/server";
import { db, runMigrations } from "./db";
import { env } from "./env";
import five from "johnny-five";
import { updateZoneColor } from "./utils";

let board: five.Board;

if (!env.DETACHED) {
  board = new five.Board({
    repl: false,
    debug: false,
  });

  board.on("ready", async () => {
    const allZones = await db.query.zones.findMany({
      with: { pins: true },
    });

    allZones.forEach((zone) => {
      updateZoneColor(zone);
    });
  });
}

await runMigrations();

const mode =
  process.env.NODE_ENV === "test" ? "development" : process.env.NODE_ENV;

const isProductionMode = mode === "production";

const app = new Hono();

/**
 * Serve assets files from build/client/assets
 */
app.use(
  "/assets/*",
  cache(60 * 60 * 24 * 365), // 1 year
  serveStatic({ root: "./build/client" }),
);

/**
 * Serve public files
 */
app.use(
  "*",
  cache(60 * 60),
  serveStatic({ root: isProductionMode ? "./build/client" : "./public" }),
); // 1 hour

/**
 * Add logger middleware
 */
app.use("*", logger());

/**
 * Add remix middleware to Hono server
 */
app.use(async (c, next) => {
  const build = (isProductionMode
    ? // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      // eslint-disable-next-line import/no-unresolved -- this expected until you build the app
      await import("../build/server/remix.js")
    : await importDevBuild()) as unknown as ServerBuild;

  return remix({
    build: build as any,
    mode,
    getLoadContext() {
      return {
        appVersion: isProductionMode ? build.assets.version : "dev",
      } satisfies AppLoadContext;
    },
  })(c, next);
});

/**
 * Start the production server
 */

if (isProductionMode) {
  serve(
    {
      ...app,
      port: Number(process.env.PORT) || 3000,
    },
    async (info) => {
      console.log(`🚀 Server started on port ${info.port}`);
    },
  );
}

export default app;

/**
 * Declare our loaders and actions context type
 */
declare module "@remix-run/node" {
  interface AppLoadContext {
    /**
     * The app version from the build assets
     */
    readonly appVersion: string;
  }
}
