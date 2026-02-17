import { Logger } from "@mern/logger";
import { BaseServer } from "@mern/server";
import { database } from "./config/db.js";
import { env } from "./config/env.js";

class MailServer extends BaseServer {
  constructor() {
    super({
      port: env.SERVER_PORT,
      errorStackTrace: env.NODE_ENV === "development",
    });
  }

  protected async configure(): Promise<void> {
    await database.connect();

    const { emailWorker } = await import("./emails/worker.js");

    Logger.success("[MailServer] Running — listening for email jobs...");

    // Step 3: Graceful shutdown
    const shutdown = async (signal: string): Promise<void> => {
      Logger.info(
        `[MailServer] ${signal} received — shutting down gracefully...`,
      );

      // Close the BullMQ worker (waits for any in-flight job to finish)
      await emailWorker.close();

      Logger.info("[MailServer] Shutdown complete");
      process.exit(0);
    };

    process.on("SIGTERM", () => void shutdown("SIGTERM"));
    process.on("SIGINT", () => void shutdown("SIGINT"));
  }

  protected registerRoutes(): void {}
}

export default MailServer;
