import { BaseServer } from "@mern/server";

import { Cache } from "@mern/cache";
import { env } from "@mern/env";
import { JobRecordService, QueueManager } from "@mern/queue";
import { cookieOptions } from "./config/cookies.js";
import { corsOptions } from "./config/cors.js";
import { database } from "./config/db.js";
import redis, { redisConnectionOptions } from "./config/redis.js";
import { router as invitationsRouter } from "./routes/invitations.js";
import { router as organizationsRouter } from "./routes/organizations.js";

class MainServer extends BaseServer {
  constructor() {
    super({
      port: env.MAIN_SERVER_PORT,
      corsOptions,
      cookieOptions,
      errorStackTrace: env.NODE_ENV === "development",
    });
  }

  protected async configure(): Promise<void> {
    await database.connect();
    Cache.init(redis);
    // main-server only enqueues jobs (org invitation emails, member joined emails)
    // Workers run in sync-server — enableWorkers: false here
    QueueManager.init(redisConnectionOptions);
    JobRecordService.init(database.db);
  }

  protected registerRoutes(): void {
    this.app.use("/api/organizations", organizationsRouter);
    this.app.use("/api/invitations", invitationsRouter);
  }
}

export default MainServer;
