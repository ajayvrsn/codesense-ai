let app;
let appPromise;

export default async (req, res) => {
  try {
    if (!appPromise) {
      console.log("Initializing app...");
      appPromise = import("../dist/server.js").then(({ default: createApp }) => createApp());
    }
    app = await appPromise;
    return app(req, res);
  } catch (error) {
    console.error("Server error:", error);
    appPromise = undefined;
    if (!res.headersSent) {
      res.status(500).json({ error: "Server initialization failed" });
    }
  }
};
