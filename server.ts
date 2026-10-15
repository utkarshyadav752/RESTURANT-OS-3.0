import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { authRouter } from './server/routes/auth.ts';
import { apiRouter } from './server/routes/api.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  // In AI Studio, the dev server must always listen on port 3000.
  // Port 8080 is reserved by the container ingress proxy.
  const port = 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // Log API requests
  app.use('/api', (req, _res, next) => {
    console.log(`[API ${req.method}] ${req.url}`);
    next();
  });

  // Mount API routers
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1', apiRouter);

  // Health endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), platform: 'RestaurantOS' });
  });

  if (!isProduction) {
    // Vite middleware for development
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 RestaurantOS server is running on http://0.0.0.0:${port}`);
  });
}

startServer().catch(err => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
