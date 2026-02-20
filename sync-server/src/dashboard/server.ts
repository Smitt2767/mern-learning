import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { Logger } from "@mern/logger";
import { QueueManager } from "@mern/queue";
import cookieParser from "cookie-parser";
import express from "express";
import type { Server } from "node:http";
import { env } from "../config/env.js";
import {
  getLoginPage,
  postLogin,
  postLogout,
  requireDashboardAuth,
} from "./auth.js";

const BOARD_BASE_PATH = "/queues";

/**
 * Creates and starts a standalone Express HTTP server with Bull Board mounted
 * at /queues, protected by JWT cookie auth at /auth/*.
 *
 * Must be called after QueueRegistry.init() so QueueManager.getQueues()
 * returns the eagerly-initialised queue instances.
 *
 * Returns the underlying http.Server so the caller can close it on shutdown.
 */
export async function startDashboard(): Promise<Server> {
  // ─── Bull Board setup ───────────────────────────────────────────────────────

  const queueMap = QueueManager.getQueues();
  // Cast through unknown: QueueManager stores Queue<unknown,unknown> internally;
  // BullMQAdapter expects Queue<any,any>. The shapes are structurally identical.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapters = [...queueMap.values()].map((q) => new BullMQAdapter(q as any));

  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath(BOARD_BASE_PATH);

  createBullBoard({
    queues: adapters,
    serverAdapter,
    options: {
      uiConfig: {
        boardTitle: "Sync Server Queues",
        miscLinks: [{ text: "Logout", url: "/auth/logout" }],
      },
    },
  });

  // ─── Express app ────────────────────────────────────────────────────────────

  const app = express();

  app.use(cookieParser());
  app.use(express.urlencoded({ extended: false }));

  // Public auth routes
  app.get("/auth/login", getLoginPage);
  app.post("/auth/login", postLogin);
  app.post("/auth/logout", postLogout);

  // Root → board redirect
  app.get("/", (_req, res) => {
    res.redirect(302, BOARD_BASE_PATH);
  });

  // Protected dashboard routes
  app.use(BOARD_BASE_PATH, requireDashboardAuth, serverAdapter.getRouter());

  // ─── Start listening ─────────────────────────────────────────────────────────

  return new Promise<Server>((resolve, reject) => {
    const httpServer = app.listen(env.DASHBOARD_PORT, () => {
      Logger.success(
        `Dashboard → http://localhost:${env.DASHBOARD_PORT}${BOARD_BASE_PATH}`,
      );
      resolve(httpServer);
    });

    httpServer.on("error", reject);
  });
}
