import express, { Request, Response } from 'express';
import { authRouter } from '../server/routes/auth.ts';
import { apiRouter } from '../server/routes/api.ts';

const app = express();

app.use(express.json());

// Log API requests
app.use('/api', (req, _res, next) => {
  console.log(`[Vercel Serverless API ${req.method}] ${req.url}`);
  next();
});

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    platform: 'RestaurantOS (Vercel Serverless)',
  });
});

// Mount routers
app.use('/api/v1/auth', authRouter);
app.use('/api/v1', apiRouter);

export default app;
