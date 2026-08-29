import startServer from "../dist/server.js";

let app;

export default async (req, res) => {
  if (!app) {
    app = await startServer();
  }
  return app(req, res);
};
