import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      {
        name: 'api-reason-dev-server',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url === '/api/reason' && req.method === 'POST') {
              let body = '';
              req.on('data', (chunk) => {
                body += chunk;
              });
              req.on('end', async () => {
                try {
                  req.body = JSON.parse(body || '{}');
                } catch {
                  req.body = {};
                }
                process.env.GROQ_API_KEY = env.GROQ_API_KEY || process.env.GROQ_API_KEY;

                res.status = function (code) {
                  this.statusCode = code;
                  return this;
                };
                res.json = function (data) {
                  this.setHeader('Content-Type', 'application/json');
                  this.end(JSON.stringify(data));
                  return this;
                };

                try {
                  const { default: handler } = await import('./api/reason.js');
                  await handler(req, res);
                } catch (err) {
                  res.status(500).json({ error: err.message });
                }
              });
            } else {
              next();
            }
          });
        },
      },
    ],
  };
});
