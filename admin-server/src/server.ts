import { BaseServer } from "@mern/server";

import { Cache } from "@mern/cache";
import { seedRbac } from "@mern/database";
import { env } from "@mern/env";
import { cookieOptions } from "./config/cookies.js";
import { corsOptions } from "./config/cors.js";
import { database } from "./config/db.js";
import redis from "./config/redis.js";
import { router as organizationsRouter } from "./routes/organizations.js";
import { router as permissionsRouter } from "./routes/permissions.js";
import { router as rolesRouter } from "./routes/roles.js";
import { router as usersRouter } from "./routes/users.js";

class AdminServer extends BaseServer {
  constructor() {
    super({
      port: env.ADMIN_SERVER_PORT,
      corsOptions,
      cookieOptions,
      errorStackTrace: env.NODE_ENV === "development",
    });
  }

  protected async configure(): Promise<void> {
    await database.connect();
    env.EXECUTE_BOOT_SCRIPTS && (await seedRbac(database.db));
    Cache.init(redis);
  }

  protected registerRoutes(): void {
    this.app.use("/api/permissions", permissionsRouter);
    this.app.use("/api/roles", rolesRouter);
    this.app.use("/api/users", usersRouter);
    this.app.use("/api/organizations", organizationsRouter);
  }
}

export default AdminServer;
