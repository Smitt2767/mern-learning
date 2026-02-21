import { Logger } from "@mern/logger";

import AdminServer from "./server.js";

process.on("unhandledRejection", (reason: unknown) => {
  Logger.error("UNHANDLED REJECTION:", reason);
});

process.on("uncaughtException", (error: Error) => {
  Logger.error("UNCAUGHT EXCEPTION:", error);
  process.exit(1);
});

const server = new AdminServer();
await server.bootstrap();
server.start();
