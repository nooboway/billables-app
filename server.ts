import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Status Page Route
  app.get("/api", (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Billables API</title>
        <style>
          body {
            background-color: #0c0a09; /* stone-950 */
            color: #f5f5f4; /* stone-50 */
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            margin: 0;
            padding: 2rem;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          .container {
            background-color: #171412; /* slightly lighter than body */
            border: 1px solid #292524; /* stone-800 */
            border-radius: 1rem;
            padding: 2.5rem;
            width: 100%;
            max-width: 32rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3);
          }
          h1 {
            margin: 0;
            font-size: 2.5rem;
            font-weight: 900;
            letter-spacing: -0.05em;
          }
          .status {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: #4ade80; /* emerald-400 */
            font-size: 0.875rem;
            margin-top: 0.5rem;
            margin-bottom: 2rem;
          }
          .dot {
            width: 8px;
            height: 8px;
            background-color: #4ade80;
            border-radius: 50%;
            display: inline-block;
          }
          h2 {
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #78716c; /* stone-500 */
            border-bottom: 1px solid #292524;
            padding-bottom: 0.5rem;
            margin-bottom: 1rem;
          }
          .endpoints {
            display: flex;
            flex-direction: column;
          }
          .endpoint {
            display: flex;
            align-items: center;
            padding: 0.75rem 0;
            border-bottom: 1px solid #292524;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
            font-size: 0.875rem;
          }
          .endpoint:last-child {
            border-bottom: none;
          }
          .method {
            font-weight: 700;
            width: 4rem;
          }
          .method.post {
            color: #3b82f6; /* blue-500 */
          }
          .method.get {
            color: #3b82f6; /* blue-500, could also use emerald or purple, based on screenshot it looks bluish */
          }
          .path {
            color: #d6d3d1; /* stone-300 */
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Billables</h1>
          <div class="status">
            <span class="dot"></span>
            API is running
          </div>

          <h2>Endpoints</h2>
          <div class="endpoints">
            <div class="endpoint">
              <span class="method post">POST</span>
              <span class="path">/api/v1/auth/register</span>
            </div>
            <div class="endpoint">
              <span class="method post">POST</span>
              <span class="path">/api/v1/auth/login</span>
            </div>
            <div class="endpoint">
              <span class="method get">GET</span>
              <span class="path">/api/v1/documents</span>
            </div>
            <div class="endpoint">
              <span class="method get">GET</span>
              <span class="path">/api/v1/clients</span>
            </div>
            <div class="endpoint">
              <span class="method get">GET</span>
              <span class="path">/api/v1/products</span>
            </div>
            <div class="endpoint">
              <span class="method get">GET</span>
              <span class="path">/api/v1/expenses</span>
            </div>
            <div class="endpoint">
              <span class="method get">GET</span>
              <span class="path">/api/v1/health</span>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
  });

  // Mock API endpoints
  app.post("/api/v1/auth/register", (req, res) => res.json({ message: "Registration successful" }));
  app.post("/api/v1/auth/login", (req, res) => res.json({ token: "mock-token", user: { id: 1 } }));
  app.get("/api/v1/documents", (req, res) => res.json({ data: [] }));
  app.get("/api/v1/clients", (req, res) => res.json({ data: [] }));
  app.get("/api/v1/products", (req, res) => res.json({ data: [] }));
  app.get("/api/v1/expenses", (req, res) => res.json({ data: [] }));
  app.get("/api/v1/health", (req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Important: In Express v4 we use * instead of *all
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
