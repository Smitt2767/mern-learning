import { SyncServer } from "./server.js";

const server = new SyncServer();

server.start().catch((err) => {
  console.error("Failed to start SyncServer:", err);
  process.exit(1);
});
