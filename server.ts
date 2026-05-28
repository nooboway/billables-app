/**
 * Billable — Express + Vite shell.
 *
 * Dev:  serves the SPA via Vite middleware on port 3000.
 * Prod: serves the `dist/` build with a catch-all → index.html so the
 *       client-side router (wouter) handles every route.
 *
 * No API routes — Billable is a frontend-only app; every entity lives
 * in localStorage under the billables_* namespace (see src/lib/
 * persistence.ts + workspaces.ts). The previous /api/v1/* mock
 * endpoints (auth/register, documents, clients, products, expenses,
 * health) were never wired into the React app and were removed.
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  if (process.env.NODE_ENV !== "production") {
    // Dev — let Vite handle everything (HMR, transforms, asset graph).
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Prod — serve the static build + SPA fallback for client routes.
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Billable server listening on http://localhost:${PORT}`);
  });
}

startServer();
