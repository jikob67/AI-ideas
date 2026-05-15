import express from "express";
import path from "path";
import axios from "axios";
import cookieSession from "cookie-session";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  console.log("Starting server...");

  app.set('trust proxy', 1);
  app.use(express.json({ limit: '50mb' }));
  app.use(cookieSession({
    name: 'session',
    keys: [process.env.SESSION_SECRET || 'ai-ideas-secret'],
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: true,
    sameSite: 'none'
  }));

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", env: process.env.NODE_ENV });
  });

  // Proxy route for URL to Code
  app.get('/api/proxy', async (req, res) => {
    let { url } = req.query;
    if (!url) return res.status(400).json({ error: 'Missing url' });
    
    let targetUrl = url as string;
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    console.log(`Proxying request for URL: ${targetUrl}`);
    try {
      const response = await axios.get(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000 // 10 seconds timeout
      });
      console.log(`Successfully fetched content for ${targetUrl} (${response.data.length} bytes)`);
      res.send(response.data);
    } catch (error: any) {
      console.error(`Proxy error for ${targetUrl}:`, error.message);
      res.status(500).json({ error: `Failed to fetch URL: ${error.message}` });
    }
  });
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Server Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log("Vite middleware loaded");
    } catch (e) {
      console.error("Failed to load Vite middleware:", e);
    }
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("Serving static files from dist");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
