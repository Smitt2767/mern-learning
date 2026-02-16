import { Logger } from "@mern/logger";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Application } from "express";
import helmet from "helmet";
import hpp from "hpp";
import morgan from "morgan";

import { Jwt } from "./index.js";
import { createErrorHandler } from "./middleware/error-handler.js";
import type { ServerConfig } from "./types.js";
import { AppError } from "./utils/app-error.js";
import { Cookie } from "./utils/cookie.js";

export abstract class BaseServer {
  public app: Application;
  protected config: ServerConfig;

  constructor(config: ServerConfig) {
    this.config = config;
    this.app = express();

    Jwt.init(config.jwt);
    Cookie.init(config.cookieOptions);
  }

  async bootstrap(): Promise<void> {
    await this.configure();
    this.setupCommonMiddleware();
    this.configureMiddleware();
    this.registerRoutes();
    this.setupErrorHandling();
  }

  private setupCommonMiddleware(): void {
    this.app.set("trust proxy", this.config.trustProxy ?? 1);
    this.app.use(helmet());
    this.app.use(hpp());
    this.app.use(express.json());
    this.app.use(cors(this.config.corsOptions));
    this.app.use(cookieParser());
    this.app.use(morgan("tiny"));
  }

  protected async configure(): Promise<void> {}
  protected configureMiddleware(): void {}

  protected abstract registerRoutes(): void;

  private setupErrorHandling(): void {
    this.app.all("*splat", (req) => {
      throw AppError.notFound(`Cannot find ${req.originalUrl}`);
    });

    this.app.use(createErrorHandler(this.config.errorStackTrace));
  }

  start(): void {
    const server = this.app.listen(this.config.port, () => {
      const addr = server.address();
      const bind =
        typeof addr === "string"
          ? addr
          : `http://${addr?.address === "::" ? "localhost" : addr?.address}:${addr?.port}`;
      Logger.success(`API is running at ${bind}`);
    });
  }
}
