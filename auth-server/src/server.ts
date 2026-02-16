import { BaseServer } from "@mern/server";

import { Cache } from "@mern/cache";
import { cookieOptions } from "./config/cookies.js";
import { corsOptions } from "./config/cors.js";
import { database } from "./config/db.js";
import { env } from "./config/env.js";
import redis from "./config/redis.js";
import { router as authRouter } from "./routes/auth.js";
import { router as userRouter } from "./routes/user.js";

class AuthServer extends BaseServer {
  constructor() {
    super({
      port: env.SERVER_PORT,
      corsOptions,
      cookieOptions,
      errorStackTrace: env.NODE_ENV === "development",
    });
  }

  protected async configure(): Promise<void> {
    await database.connect();
    Cache.init(redis);
  }

  protected registerRoutes(): void {
    this.app.use("/api/auth", authRouter);
    this.app.use("/api/user", userRouter);
  }
}

export default AuthServer;
