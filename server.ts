import express from "express";
import path from "path";
import axios from "axios";
import cookieSession from "cookie-session";
import { fileURLToPath } from "url";
import { Readable } from "stream";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  console.log("Starting server...");

  // Initialize Gemini
  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

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

  // Serve static files from the 'public' directory
  app.use(express.static("public"));

  // --- Gemini API Endpoints ---
  
  // "Netlify Function" style endpoint requested by user
  app.post("/api/netlify-function-mock", async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Missing prompt" });

    try {
      console.log("Mock Netlify Function triggered with prompt:", prompt);
      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      });
      const responseText = response.text || "No response received";
      
      console.log("Gemini response retrieved successfully");
      res.json({ result: responseText });
    } catch (error: any) {
      console.error("Netlify Mock Error:", error.message);
      res.status(error.status || 500).json({ error: error.message });
    }
  });

  app.post("/api/gemini/generate", async (req, res) => {
    const { model, contents, config } = req.body;
    try {
      const response = await ai.models.generateContent({
        model: model || "gemini-flash-latest",
        contents,
        config
      });
      res.json({ response });
    } catch (error: any) {
      console.error("Gemini Generate Error:", error.message);
      const status = error.status || (error.message?.includes('429') ? 429 : 500);
      res.status(status).json({ error: error.message });
    }
  });

  app.post("/api/gemini/stream", async (req, res) => {
    const { model, contents, config } = req.body;
    try {
      const response = await ai.models.generateContentStream({
        model: model || "gemini-flash-latest",
        contents,
        config
      });

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      for await (const chunk of response) {
        res.write(`data: ${JSON.stringify({ response: chunk })}\n\n`);
      }
      res.end();
    } catch (error: any) {
      console.error("Gemini Stream Error:", error.message);
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  });

  // Video Generation endpoints
  app.post("/api/gemini/generate-video", async (req, res) => {
    const { model, prompt, image, config } = req.body;
    try {
      const operation = await ai.models.generateVideos({
        model: model || 'veo-3.1-lite-generate-preview',
        prompt,
        ...(image && { image: { imageBytes: image.base64, mimeType: image.mimeType } }),
        config
      });
      res.json({ operationName: operation.name });
    } catch (error: any) {
      console.error("Gemini Video Start Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gemini/video-status", async (req, res) => {
    const { operationName } = req.body;
    try {
      const { GenerateVideosOperation } = await import('@google/genai');
      const op = new GenerateVideosOperation();
      op.name = operationName;
      const updated = await ai.operations.getVideosOperation({ operation: op });
      res.json(updated);
    } catch (error: any) {
      console.error("Gemini Video Status Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/gemini/video-download", async (req, res) => {
    const { operationName } = req.query;
    if (typeof operationName !== 'string') return res.status(400).json({ error: "operationName is required" });
    try {
      const { GenerateVideosOperation } = await import('@google/genai');
      const op = new GenerateVideosOperation();
      op.name = operationName;
      const updated = await ai.operations.getVideosOperation({ operation: op });
      const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
      
      if (!uri) return res.status(404).json({ error: "Video not found or not ready" });

      const videoRes = await fetch(uri, {
        headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY! },
      });

      res.setHeader('Content-Type', 'video/mp4');
      if (videoRes.body) {
          const reader = videoRes.body.getReader();
          while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              res.write(value);
          }
      }
      res.end();
    } catch (error: any) {
      console.error("Gemini Video Download Error:", error.message);
      res.status(500).json({ error: error.message });
    }
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
