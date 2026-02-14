import { env } from "./env.js";
import Server from "./server.js";

const server = new Server(env.SERVER_PORT);
server.start();
