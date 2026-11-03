import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Stream proxy with CORS support for live radio broadcasts
  app.get('/api/stream-proxy', async (req, res) => {
    const streamUrl = req.query.url as string;
    if (!streamUrl) {
      return res.status(400).send('URL parametresi eksik.');
    }

    try {
      const controller = new AbortController();
      const clientClosed = () => {
        controller.abort();
      };
      req.on('close', clientClosed);

      const response = await fetch(streamUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: '*/*',
          ...(req.headers.range ? { Range: req.headers.range } : {}),
        },
        signal: controller.signal,
      });

      if (!response.ok && response.status >= 400 && response.status !== 206) {
        req.off('close', clientClosed);
        return res
          .status(response.status)
          .send(`Radyo sunucusu yanıt vermedi: ${response.statusText}`);
      }

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
      res.setHeader(
        'Content-Type',
        response.headers.get('content-type') || 'audio/mpeg'
      );
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

      if (!response.body) {
        req.off('close', clientClosed);
        return res.status(502).send('Yayın akışı alınamadı.');
      }

      const reader = response.body.getReader();

      const pump = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (res.writableEnded) break;
            res.write(value);
          }
        } catch {
          // Stream ended or connection closed
        } finally {
          req.off('close', clientClosed);
          if (!res.writableEnded) {
            res.end();
          }
        }
      };

      pump();
    } catch (error: any) {
      if (!res.headersSent) {
        res.status(500).send('Yayın aktarma hatası: ' + error?.message);
      }
    }
  });

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ILGIN RADYO sunucusu ${PORT} portunda çalışıyor.`);
  });
}

startServer();
