import express from "express";

class Server {
  private port: number;
  public app: express.Application;

  constructor(port: number) {
    this.app = express();
    this.port = port;
    this.config();
    this.routes();
  }

  public config() {}

  public routes() {
    this.app.get("/", (_, res) => {
      res.send("Hello World");
    });
  }

  public start() {
    this.app.listen(this.port, () => {
      console.log(`API is running at http://localhost:${this.port}`);
    });
  }
}

export default Server;
