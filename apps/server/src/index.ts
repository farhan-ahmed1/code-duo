import { getRequestListener } from '@hono/node-server';
import { createServer } from 'node:http';
import { Hono } from 'hono';
import { WebSocketServer } from 'ws';
import { apiRouter } from './api/routes';
import { corsMiddleware, requestLogger, errorHandler } from './api/middleware';
import { setupWebSocketServer } from './ws-server';
import { logger } from './utils/logger';
import { initMetrics } from './utils/metrics';

const PORT = Number(process.env.PORT ?? 4000);

const app = new Hono();

app.use('*', corsMiddleware);
app.use('*', requestLogger);
app.route('/api', apiRouter);
app.onError(errorHandler);

const httpServer = createServer();
const wss = new WebSocketServer({ noServer: true });

setupWebSocketServer(wss);

httpServer.on('upgrade', (req, socket, head) => {
  if (req.url?.startsWith('/yjs/')) {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  } else {
    socket.destroy();
  }
});

httpServer.on('request', getRequestListener(app.fetch));

httpServer.listen(PORT, () => {
  logger.info({ port: PORT }, 'Code Duo server started');
  initMetrics();
});

export { app };
