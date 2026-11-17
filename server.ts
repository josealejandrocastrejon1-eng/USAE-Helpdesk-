import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { createHelpdeskApp } from './server/app.ts';
import {
  bootstrapProductionAdminIfConfigured,
  openDatabase,
  seedDemoDataIfEmpty,
} from './server/db.ts';

const PORT = Number(process.env.PORT) || 3000;
const DB_PATH = path.resolve(process.cwd(), 'data', 'usae_helpdesk.db');
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

async function startServer() {
  const db = openDatabase(DB_PATH);
  seedDemoDataIfEmpty(db);
  bootstrapProductionAdminIfConfigured(db);

  const app = createHelpdeskApp(db, {
    uploadsDir: UPLOADS_DIR,
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    const distIndex = path.join(distDir, 'index.html');
    app.use(
      express.static(distDir, {
        index: false,
        maxAge: '7d',
        setHeaders(res, filePath) {
          if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-store');
          } else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          }
        },
      })
    );
    app.get('*', (_req, res) => {
      if (!fs.existsSync(distIndex)) {
        res.status(503).json({
          success: false,
          message: 'Compilación frontend (dist) no disponible. Ejecuta npm run build.',
          code: 'DIST_NOT_BUILT',
        });
        return;
      }
      res.setHeader('Cache-Control', 'no-store');
      res.sendFile(distIndex);
    });
  }

  const httpServer = app.listen(PORT, '0.0.0.0', () => {
    console.log(`USAE Helpdesk server listening on http://0.0.0.0:${PORT}`);
  });

  const shutdown = () => {
    httpServer.close(() => {
      try {
        db.close();
      } catch {
        // ignore double-close
      }
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer().catch((err) => {
  console.error('Failed to start USAE Helpdesk server:', err);
  process.exit(1);
});
