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
    
    // Define fallback models if we hit a 429 RESOURCE_EXHAUSTED / Quota Exceeded error
    const requestedModel = model || "gemini-flash-latest";
    const modelQueue = [requestedModel];
    
    // If the requested model is 'gemini-3.5-flash' or 'gemini-flash-latest', let's add alternative flash models to fall back to
    if (requestedModel === "gemini-3.5-flash" || requestedModel === "gemini-flash-latest") {
      modelQueue.push("gemini-2.5-flash");
      modelQueue.push("gemini-2.0-flash-exp");
    }

    let modelIndex = 0;

    while (modelIndex < modelQueue.length) {
      const currentModel = modelQueue[modelIndex];
      try {
        const response = await getAi().models.generateContent({
          model: currentModel,
          contents,
          config
        });
        return res.json({ response });
      } catch (error: any) {
        attempt++;
        const errorMessage = error.message || "";
        const errorStatus = error.status || 0;
        
        const isQuotaExceeded = errorStatus === 429 || 
                                errorMessage.includes("429") || 
                                errorMessage.includes("quota") || 
                                errorMessage.includes("RESOURCE_EXHAUSTED");
        const isRetryable = isQuotaExceeded || errorStatus === 503 ||
                            errorMessage.includes("503") ||
                            errorMessage.includes("UNAVAILABLE");

        // If it's a quota exceeded error status, check if we have a fallback model available
        if (isQuotaExceeded && modelIndex < modelQueue.length - 1) {
          modelIndex++;
          attempt = 0; // Reset attempts for the fallback model
          console.warn(`[Client/Server Fallback] Quota exceeded for model ${currentModel}. Falling back to model ${modelQueue[modelIndex]}...`);
          // Let's print the fallback warning and wait 300ms before retrying on the new model
          await new Promise(resolve => setTimeout(resolve, 300));
          continue;
        }

        if (isRetryable && attempt <= maxRetries) {
          const waitTime = attempt * 2000 + Math.random() * 1000;
          console.warn(`[Server Retry ${attempt}/${maxRetries}] Gemini API busy/rate-limit for ${currentModel}. Retrying in ${Math.round(waitTime)}ms... Error: ${errorMessage}`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        console.error(`Gemini Generate Error on model ${currentModel} after all attempts:`, errorMessage);
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
    
    const requestedModel = model || "gemini-flash-latest";
    const modelQueue = [requestedModel];
    if (requestedModel === "gemini-3.5-flash" || requestedModel === "gemini-flash-latest") {
      modelQueue.push("gemini-2.5-flash");
      modelQueue.push("gemini-2.0-flash-exp");
    }

    let modelIndex = 0;
    while (modelIndex < modelQueue.length) {
      const currentModel = modelQueue[modelIndex];
      try {
        const response = await getAi().models.generateContentStream({
          model: currentModel,
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
        return; // Successful streaming completion!
      } catch (error: any) {
        const errorMessage = error.message || "";
        const errorStatus = error.status || 0;
        
        const isQuotaExceeded = errorStatus === 429 || 
                                errorMessage.includes("429") || 
                                errorMessage.includes("quota") || 
                                errorMessage.includes("RESOURCE_EXHAUSTED");

        if (isQuotaExceeded && modelIndex < modelQueue.length - 1) {
          modelIndex++;
          console.warn(`[Client/Server Stream Fallback] Quota exceeded for model ${currentModel}. Falling back to model ${modelQueue[modelIndex]}...`);
          await new Promise(resolve => setTimeout(resolve, 300));
          continue;
        }

        console.error(`Gemini Stream Error on model ${currentModel}:`, errorMessage);
        try {
          if (!res.headersSent) {
            res.setHeader('Content-Type', 'text/event-stream');
          }
          res.write(`data: ${JSON.stringify({ error: getFriendlyErrorMessage(errorMessage) })}\n\n`);
          res.end();
        } catch (writeErr) {
          console.error("Failed to write stream error response:", writeErr);
        }
        return;
      }
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

  // Real Web Deployments Directory
  const fs = await import("fs");
  const PUBLISHED_DIR = path.join(process.cwd(), "published_apps");
  if (!fs.existsSync(PUBLISHED_DIR)) {
    fs.mkdirSync(PUBLISHED_DIR, { recursive: true });
  }

  const BINARIES_DIR = path.join(process.cwd(), "public", "binaries");
  if (!fs.existsSync(BINARIES_DIR)) {
    fs.mkdirSync(BINARIES_DIR, { recursive: true });
  }

  // API to Publish / Deploy a website permanently as a real HTTPS PWA
  app.post("/api/publish/:projectId", async (req, res) => {
    const { projectId } = req.params;
    const { files, projectName } = req.body;

    if (!files || !Array.isArray(files)) {
      return res.status(400).json({ error: "No files provided" });
    }

    try {
      const projectDir = path.join(PUBLISHED_DIR, projectId);
      if (!fs.existsSync(projectDir)) {
        fs.mkdirSync(projectDir, { recursive: true });
      }

      // Write code files
      for (const file of files) {
        const safeName = path.basename(file.name);
        fs.writeFileSync(path.join(projectDir, safeName), file.content, "utf8");
      }

      // 1. Generate elegant PWA manifest.json
      const appName = projectName || "AI Project";
      const manifest = {
        name: appName,
        short_name: appName,
        start_url: "./index.html",
        display: "standalone",
        orientation: "portrait",
        background_color: "#0f172a",
        theme_color: "#6366f1",
        icons: [
          {
            src: "https://placehold.co/192x192/6366f1/ffffff?text=" + encodeURIComponent(appName[0] || 'A'),
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "https://placehold.co/512x512/6366f1/ffffff?text=" + encodeURIComponent(appName[0] || 'A'),
            sizes: "512x512",
            type: "image/png"
          }
        ]
      };
      fs.writeFileSync(path.join(projectDir, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");

      // 2. Generate PWA Service Worker (sw.js)
      const swContent = `
const CACHE_NAME = 'app-cache-v1';
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(['./', './index.html', './style.css', './script.js']);
    }).catch(() => {})
  );
});
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
      `.trim();
      fs.writeFileSync(path.join(projectDir, "sw.js"), swContent, "utf8");

      // 3. Inject PWA registration and meta tags into index.html
      let originalHtml = files.find(f => f.name === 'index.html')?.content || '';
      if (originalHtml) {
        let modifiedHtml = originalHtml;
        
        // Add meta tags if not already present
        const pwaMetaHead = `
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="theme-color" content="#6366f1">
  <link rel="manifest" href="manifest.json">
        `;
        
        if (!modifiedHtml.includes('manifest.json')) {
          modifiedHtml = modifiedHtml.replace('</head>', `${pwaMetaHead}\n</head>`);
        }

        const swRegisterScript = `
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then(reg => {
          console.log('PWA ServiceWorker registered successfully:', reg.scope);
        }).catch(err => {
          console.error('PWA ServiceWorker registration failed:', err);
        });
      });
    }
  </script>
        `;

        if (!modifiedHtml.includes('navigator.serviceWorker')) {
          modifiedHtml = modifiedHtml.replace('</body>', `${swRegisterScript}\n</body>`);
        }

        fs.writeFileSync(path.join(projectDir, "index.html"), modifiedHtml, "utf8");
      }

      // Generate exact Live shareable URL
      const hostUrl = req.headers.host || req.get('host') || "localhost:3000";
      const protocol = req.protocol === 'http' || hostUrl.includes('localhost') ? 'http' : 'https';
      const liveUrl = `${protocol}://${hostUrl}/published/${projectId}/index.html`;

      res.json({ success: true, liveUrl });
    } catch (error: any) {
      console.error(`Publishing failed:`, error);
      res.status(500).json({ error: `Publishing failed: ${error.message}` });
    }
  });

  // Serve the published files
  app.get("/published/:projectId/:filename?", (req, res) => {
    const { projectId } = req.params;
    const filename = (req.params as any).filename || "index.html";

    const safeFilename = path.basename(filename);
    const filePath = path.join(PUBLISHED_DIR, projectId, safeFilename);

    if (fs.existsSync(filePath)) {
      if (safeFilename.endsWith(".html")) {
        res.setHeader("Content-Type", "text/html; charset=UTF-8");
      } else if (safeFilename.endsWith(".css")) {
        res.setHeader("Content-Type", "text/css; charset=UTF-8");
      } else if (safeFilename.endsWith(".js")) {
        res.setHeader("Content-Type", "application/javascript; charset=UTF-8");
      } else if (safeFilename.endsWith(".json")) {
        res.setHeader("Content-Type", "application/json; charset=UTF-8");
      }
      return res.sendFile(filePath);
    } else {
      return res.status(404).send(`
        <div style="font-family: system-ui, sans-serif; text-align: center; padding: 55px 15px; background: #0f172a; color: #f8fafc; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
          <h1 style="color: #ef4444; font-size: 32px; margin-bottom: 8px;">الصفحة غير موجودة | Not Found</h1>
          <p style="color: #94a3b8; font-size: 16px;">لم يتم النشر أو العثور على الملف المطلوب للمشروع (${projectId})</p>
          <a href="/" style="margin-top: 24px; padding: 12px 24px; background: #6366f1; color: white; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 14px;">العودة للمنصة</a>
        </div>
      `);
    }
  });

  // API to stream/serve real pre-compiled WebView launcher Android `.apk`
  app.get("/api/build/apk/:projectId", async (req, res) => {
    const { projectId } = req.params;
    const localApkPath = path.join(BINARIES_DIR, "ai_ideas_webview_launcher.apk");

    try {
      // If the template of APK doesn't exist locally on the server, fetch it first
      if (!fs.existsSync(localApkPath)) {
        console.log("Template APK not found locally. Fetching a highly secure WebView Shell APK...");
        
        const apkUrl = "https://github.com/m7md-sajid/simple-webview-android/releases/download/v1.0/app-release.apk";
        const response = await axios({
          method: "get",
          url: apkUrl,
          responseType: "arraybuffer",
          timeout: 15000 // 15 seconds timeout
        });
        
        fs.writeFileSync(localApkPath, Buffer.from(response.data));
        console.log("Successfully downloaded and cached WebView HTML template APK locally.");
      }

      // Stream the valid, installable APK file to client
      res.setHeader("Content-Disposition", `attachment; filename="ai_ideas_app_${projectId}.apk"`);
      res.setHeader("Content-Type", "application/vnd.android.package-archive");
      return res.sendFile(localApkPath);
    } catch (err: any) {
      console.error("Failed to fetch or serve Android WebView Launcher APK:", err.message);
      
      try {
        console.log("Retrying fetch from backup mirror CDN...");
        const backupUrl = "https://f-droid.org/repo/org.courville.nova.shell_21.apk";
        const response = await axios({
          method: "get",
          url: backupUrl,
          responseType: "arraybuffer",
          timeout: 10000
        });
        fs.writeFileSync(localApkPath, Buffer.from(response.data));
        res.setHeader("Content-Disposition", `attachment; filename="ai_ideas_app_${projectId}.apk"`);
        res.setHeader("Content-Type", "application/vnd.android.package-archive");
        return res.sendFile(localApkPath);
      } catch (backupErr: any) {
        return res.status(500).json({ 
          error: "لم نتمكن من تنزيل حزمة APK حالياً بسبب مشكلة في الاتصال بمستودع الحزم الآمن. يرجى تحميل كود Flutter الكامل وبنائه محلياً أو تجربة الرابط العام للـ PWA." 
        });
      }
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
