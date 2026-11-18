import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';
import type { Request, Response } from 'express';
import {
  ensureStorageReady,
  getDriverProfile,
  registerDriver,
} from './api/_lib/driverStore.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const app = express();

app.use(express.json({ limit: '18mb' }));

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.get('/api/drivers/me', async (req: Request, res: Response) => {
  const result = await getDriverProfile(
    req.headers['x-driver-id'],
    req.headers['x-driver-token']
  );
  res.status(result.status).json(result.body);
});

app.post('/api/drivers/register', async (req: Request, res: Response) => {
  const result = await registerDriver(req.body);
  res.status(result.status).json(result.body);
});

if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
  const distDir = path.resolve(__dirname, 'dist');
  app.use(express.static(distDir));
  app.get('*', (req: Request, res: Response) => {
    if (req.path.startsWith('/api/')) {
      res.status(404).json({ success: false, message: 'Ruta API no encontrada.' });
      return;
    }
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

async function startLocalServer(): Promise<void> {
  await ensureStorageReady();

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor ejecutándose en http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startLocalServer().catch((err) => {
    console.error('Error fatal al iniciar el servidor:', err);
    process.exit(1);
  });
}

export default app;
