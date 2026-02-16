import { Logger } from "@mern/logger";

import { env } from "./config/env.js";
import Server from "./server.js";

process.on("unhandledRejection", (reason: unknown) => {
  Logger.error("UNHANDLED REJECTION:", reason);
});

process.on("uncaughtException", (error: Error) => {
  Logger.error("UNCAUGHT EXCEPTION:", error);
  process.exit(1);
});

const server = new Server(env.SERVER_PORT);
server.start();
