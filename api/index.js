import createApp from "../dist/server.js";

let app;

export default async (req, res) => {
  try {
    if (!app) {
      console.log("Initializing app...");
      app = await createApp();
    }
    return app(req, res);
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: error.message });
  }
};
