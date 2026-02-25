import MainServer from "./server.js";

const server = new MainServer();

server
  .bootstrap()
  .then(() => server.start())
  .catch((err) => {
    console.error("Failed to start MainServer:", err);
    process.exit(1);
  });
