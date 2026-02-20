import { Logger } from "@mern/logger"
import { QueueRegistry } from "@mern/queue"

import { database } from "./config/db.js"
import { redisConnectionOptions } from "./config/redis.js"
import { registerEmailWorker } from "./workers/email.js"

export class MailServer {
  async start(): Promise<void> {
    Logger.info("MailServer starting…")

    await database.connect()

    QueueRegistry.init({
      connection: redisConnectionOptions,
      db: database.db,
      enableWorkers: true,
    })

    registerEmailWorker()

    this.registerShutdownHooks()

    Logger.success("MailServer started — email workers are live.")
  }

  private registerShutdownHooks(): void {
    const shutdown = async (signal: string) => {
      Logger.info(`[mail] Received ${signal} — shutting down gracefully…`)
      try {
        await QueueRegistry.shutdown()
        await database.client.end()
        Logger.success("[mail] Graceful shutdown complete.")
      } catch (err) {
        Logger.error("[mail] Error during shutdown:", err)
      } finally {
        process.exit(0)
      }
    }

    process.on("SIGTERM", () => shutdown("SIGTERM"))
    process.on("SIGINT", () => shutdown("SIGINT"))
    process.on("uncaughtException", (err) => {
      Logger.error("[mail] Uncaught exception:", err)
      process.exit(1)
    })
    process.on("unhandledRejection", (reason) => {
      Logger.error("[mail] Unhandled rejection:", reason)
      process.exit(1)
    })
  }
}
