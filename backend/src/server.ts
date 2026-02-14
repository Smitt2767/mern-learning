import { Logger } from "@mern/logger";
import cookieParser from "cookie-parser";
import express from "express";
import morgan from "morgan";

import { corsConfig } from "./config/cors.js";
import { connectDB } from "./db/index.js";

class Server {
  private port: number;
  public app: express.Application;

  constructor(port: number) {
    this.port = port;

    this.app = express();

    this.config();
    this.routes();
  }

  public async config() {
    connectDB();
    this.app.use(corsConfig());
    this.app.use(cookieParser());
    this.app.use(morgan("tiny"));
  }

  public routes() {
    this.app.get("/", (_, res) => {
      res.send("Hello World");
    });
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
