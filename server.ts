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

  function getFriendlyErrorMessage(errMessage: string): string {
    if (!errMessage) return "عذرًا، حدث خطأ غير متوقع.";
    
    const msg = errMessage.toLowerCase();
    
    if (msg.includes("429") || msg.includes("quota") || msg.includes("limit") || msg.includes("exhausted") || msg.includes("resource_exhausted")) {
      return "لقد تجاوزت الحصة المتاحة لطلب تعديلات الذكاء الاصطناعي (Quota Exceeded). يرجى مراجعة حد تراخيص مفتاح API المجاني أو المحاولة لاحقاً.";
    }
    if (msg.includes("503") || msg.includes("unavailable") || msg.includes("high demand") || msg.includes("busy")) {
      return "الخدمة غير متوفرة حالياً بسبب الضغط العالي على خوادم الذكاء الاصطناعي. يرجى المحاولة وقت لاحق.";
    }
    if (msg.includes("key") && (msg.includes("invalid") || msg.includes("not found") || msg.includes("api_key_invalid"))) {
      return "مفتاح API الخاص بالذكاء الاصطناعي غير صالح أو غير معرّف بشكل صحيح. يرجى التحقق من مفتاح الـ API الخاص بك.";
    }
    
    return errMessage;
  }

  // Initialize Gemini lazily
  let aiClient: GoogleGenAI | null = null;
  function getAi(): GoogleGenAI {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("api_key_invalid: مفتاح API للذكاء الاصطناعي (GEMINI_API_KEY) غير معرّف في الخادم. يرجى توفير مفتاح الـ API الخاص بـ Gemini في الإعدادات.");
      }
      aiClient = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return aiClient;
  }

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
      const response = await getAi().models.generateContent({
        model: "gemini-flash-latest",
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      });
      const responseText = response.text || "No response received";
      
      console.log("Gemini response retrieved successfully");
      res.json({ result: responseText });
    } catch (error: any) {
      console.error("Netlify Mock Error:", error.message);
      res.status(error.status || 500).json({ error: getFriendlyErrorMessage(error.message) });
    }
  });

  app.post("/api/gemini/generate", async (req, res) => {
    const { model, contents, config } = req.body;
    const maxRetries = 3;
    let attempt = 0;

    while (true) {
      try {
        const response = await getAi().models.generateContent({
          model: model || "gemini-flash-latest",
          contents,
          config
        });
        return res.json({ response });
      } catch (error: any) {
        attempt++;
        const errorMessage = error.message || "";
        const errorStatus = error.status || 0;
        const isRateLimitOrUnavailable = errorStatus === 429 || errorStatus === 503 ||
                                         errorMessage.includes("429") || errorMessage.includes("503") ||
                                         errorMessage.includes("UNAVAILABLE") || errorMessage.includes("RESOURCE_EXHAUSTED");
                                         
        if (isRateLimitOrUnavailable && attempt <= maxRetries) {
          const waitTime = attempt * 2000 + Math.random() * 1000;
          console.warn(`[Server Retry ${attempt}/${maxRetries}] Gemini API busy/rate-limit. Retrying in ${Math.round(waitTime)}ms... Error: ${errorMessage}`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        console.error("Gemini Generate Error after all attempts:", errorMessage);
        let status = errorStatus || 500;
        if (!error.status) {
          if (errorMessage.includes('429')) status = 429;
          else if (errorMessage.includes('503')) status = 503;
        }
        return res.status(status).json({ error: getFriendlyErrorMessage(errorMessage) });
      }
    }
  });

  app.post("/api/gemini/stream", async (req, res) => {
    const { model, contents, config } = req.body;
    try {
      const response = await getAi().models.generateContentStream({
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
      res.write(`data: ${JSON.stringify({ error: getFriendlyErrorMessage(error.message) })}\n\n`);
      res.end();
    }
  });

  // Video Generation endpoints
  app.post("/api/gemini/generate-video", async (req, res) => {
    const { model, prompt, image, config } = req.body;
    try {
      const operation = await getAi().models.generateVideos({
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
      const updated = await getAi().operations.getVideosOperation({ operation: op });
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
      const updated = await getAi().operations.getVideosOperation({ operation: op });
      const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
      
      if (!uri) return res.status(404).json({ error: "Video not found or not ready" });

      const key = process.env.GEMINI_API_KEY;
      if (!key) throw new Error("GEMINI_API_KEY is required");

      const videoRes = await fetch(uri, {
        headers: { 'x-goog-api-key': key },
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
