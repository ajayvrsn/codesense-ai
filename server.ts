import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { initDb, query } from "./db.js";
import { analyzeCode, debugCode } from "./src/services/geminiService.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = (process.env.JWT_SECRET || "fallback-secret").trim().replace(/^["']|["']$/g, "").trim();
const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || "").trim().replace(/^["']|["']$/g, "").trim();
const GOOGLE_CLIENT_SECRET = (process.env.GOOGLE_CLIENT_SECRET || "").trim().replace(/^["']|["']$/g, "").trim();

if (!process.env.APP_URL) {
  console.warn("WARNING: APP_URL is not set. This is required for OAuth redirects to work correctly.");
}

async function createApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  // Initialize DB
  await initDb();

  // --- Debug Endpoint ---
  app.get("/api/debug/health", async (req, res) => {
    let dbStatus = "Checking...";
    const dbUrl = (process.env.DATABASE_URL || "").trim().replace(/^["']|["']$/g, "").trim();
    
    try {
      if (!dbUrl) {
        dbStatus = "Error: DATABASE_URL is missing from Secrets panel ❌";
      } else if (!dbUrl.startsWith("postgres")) {
        dbStatus = "Error: DATABASE_URL must start with 'postgresql://' ❌";
      } else {
        await query("SELECT 1");
        dbStatus = "Connected ✅";
      }
    } catch (err: any) {
      dbStatus = `Error: ${err.message} ❌ (URL starts with: ${dbUrl.substring(0, 10)}...)`;
    }

    res.json({
      database: dbStatus,
      env_check: {
        has_db_url: !!process.env.DATABASE_URL,
        has_google_id: !!process.env.GOOGLE_CLIENT_ID,
        has_google_secret: !!process.env.GOOGLE_CLIENT_SECRET,
      },
      google_client_id: GOOGLE_CLIENT_ID ? `${GOOGLE_CLIENT_ID.substring(0, 10)}... ✅` : "Missing ❌",
      google_client_secret: GOOGLE_CLIENT_SECRET ? "Present ✅" : "Missing ❌",
      jwt_secret: JWT_SECRET !== "fallback-secret" ? "Present ✅" : "Using Fallback ⚠️",
      app_url: process.env.APP_URL || "Auto-detecting ℹ️",
      node_env: process.env.NODE_ENV || "development"
    });
  });

  // --- Auth Middleware ---
  const authenticateToken = (req: any, res: any, next: any) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: "Forbidden" });
      req.user = user;
      next();
    });
  };

  // --- Auth API Routes ---

  // Register
  app.post("/api/auth/register", async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await query(
        "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email",
        [name, email, hashedPassword]
      );
      const user = result.rows[0];
      const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET);

      res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
      });
      res.json({ user });
    } catch (err: any) {
      if (err.code === "23505") {
        return res.status(400).json({ error: "Email already exists" });
      }
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const result = await query("SELECT * FROM users WHERE email = $1", [email]);
      const user = result.rows[0];

      if (!user || !user.password) {
        return res.status(400).json({ error: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(400).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET);
      res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
      });
      res.json({ user: { id: user.id, name: user.name, email: user.email } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
    res.json({ message: "Logged out" });
  });

  // Get current user
  app.get("/api/auth/me", authenticateToken, (req: any, res) => {
    res.json({ user: req.user });
  });

  // --- OAuth API Routes (Google) ---

  const getRedirectUri = (req: any) => {
    let baseUrl = (process.env.APP_URL || "").trim().replace(/^["']|["']$/g, "").trim();
    
    // Auto-detect if not provided or empty
    if (!baseUrl) {
      const host = req.get('x-forwarded-host') || req.get('host');
      const protocol = req.get('x-forwarded-proto') || (req.secure ? 'https' : 'http');
      baseUrl = `${protocol}://${host}`;
    }

    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }
    return `${baseUrl}/auth/callback`;
  };

  app.get("/api/auth/external/url", (req, res) => {
    const redirectUri = getRedirectUri(req);
    console.log(`[OAuth Debug] Generating Auth URL with redirect_uri: ${redirectUri}`);
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
      access_type: "offline",
      prompt: "consent",
    });
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    res.json({ url: authUrl });
  });

  app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send("No code provided");

    try {
      const redirectUri = getRedirectUri(req);
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: code as string,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      const { access_token } = await tokenResponse.json();
      const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const googleUser = await userResponse.json();

      // Find or create user
      let userResult = await query("SELECT * FROM users WHERE google_id = $1 OR email = $2", [googleUser.id, googleUser.email]);
      let user = userResult.rows[0];

      if (!user) {
        userResult = await query(
          "INSERT INTO users (name, email, google_id) VALUES ($1, $2, $3) RETURNING id, name, email",
          [googleUser.name, googleUser.email, googleUser.id]
        );
        user = userResult.rows[0];
      } else if (!user.google_id) {
        await query("UPDATE users SET google_id = $1 WHERE id = $2", [googleUser.id, user.id]);
      }

      const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET);
      res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
      });

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (err) {
      console.error(err);
      res.status(500).send("OAuth failed");
    }
  });

  // --- Gemini API Routes ---
  app.post("/api/analyze", authenticateToken, async (req: any, res) => {
    try {
      const { code, fileName } = req.body;
      if (!code || !fileName) {
        return res.status(400).json({ error: "Missing code or fileName" });
      }
      const result = await analyzeCode(code, fileName);
      res.json(result);
    } catch (error: any) {
      console.error("Analysis error:", error);
      res.status(500).json({ error: "Failed to analyze code. Please check your API key." });
    }
  });

  app.post("/api/debug", authenticateToken, async (req: any, res) => {
    try {
      const { code, fileName } = req.body;
      if (!code || !fileName) {
        return res.status(400).json({ error: "Missing code or fileName" });
      }
      const result = await debugCode(code, fileName);
      res.json(result);
    } catch (error: any) {
      console.error("Debug error:", error);
      res.status(500).json({ error: "Failed to debug code. Please check your API key." });
    }
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  return app;
}

// For development: create and start listening
async function startServer() {
  const app = await createApp();
  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// For Vercel: export the app creator
export default createApp;

// Start in development mode
if (process.env.NODE_ENV !== "production") {
  startServer().catch(console.error);
}
