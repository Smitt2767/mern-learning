import { Logger } from "@mern/logger";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import hpp from "hpp";
import morgan from "morgan";

import { corsConfig } from "./config/cors.js";
import { connectDB } from "./db/index.js";
import { globalErrorHandler } from "./middleware/error-handler.js";
import { router as authRouter } from "./routes/auth.js";
import { router as userRouter } from "./routes/user.js";
import { AppError } from "./utils/app-error.js";

class Server {
  private port: number;
  public app: express.Application;

  constructor(port: number) {
    this.port = port;

    this.app = express();

    this.config();
    this.routes();
    this.errorHandling();
  }

  public async config() {
    connectDB();

    // Trust the first proxy so req.ip returns the real client IP
    // instead of the proxy's IP (e.g., Nginx, AWS ALB, Cloudflare)
    this.app.set("trust proxy", 1);

    this.app.use(helmet());
    this.app.use(hpp());
    this.app.use(express.json());
    this.app.use(corsConfig());
    this.app.use(cookieParser());
    this.app.use(morgan("tiny"));
  }

  public routes() {
    this.app.use("/api/auth", authRouter);
    this.app.use("/api/user", userRouter);
  }

  private errorHandling() {
    this.app.all("*splat", (req) => {
      throw AppError.notFound(`Cannot find ${req.originalUrl}`);
    });

    this.app.use(globalErrorHandler);
  }

  public start() {
    const server = this.app.listen(this.port, () => {
      const addr = server.address();
      const bind =
        typeof addr === "string"
          ? addr
          : `http://${addr?.address === "::" ? "localhost" : addr?.address}:${addr?.port}`;
      Logger.success(`API is running at ${bind}`);
    });
  }
}

export default Server;
