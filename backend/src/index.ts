import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { Server } from 'socket.io';

import { authRouter }     from './routes/auth';
import { ordersRouter }   from './routes/orders';
import { bookingRouter }  from './routes/booking';
import { diagRouter }     from './routes/diag';
import { loyaltyRouter }     from './routes/loyalty';
import { integrationRouter } from './routes/integration';
import { chatRouter }     from './routes/chat';
import { partsRouter }    from './routes/parts';
import { warehouseRouter } from './routes/warehouse';
import { financeRouter }   from './routes/finance';
import { bookingRouter }  from './routes/booking';
import { diagRouter }     from './routes/diag';
import { loyaltyRouter }     from './routes/loyalty';
import { integrationRouter } from './routes/integration';
import { usersRouter }    from './routes/users';
import { pipelineRouter } from './routes/pipeline';
import { paymentRouter }  from './routes/payment';
import { adminRouter }    from './routes/admin';
import { analyticsRouter }  from './routes/analytics';
import { onboardingRouter } from './routes/onboarding';
import { settingsRouter }   from './routes/settings';
import { exportRouter }   from './routes/export';
import { initSocket }        from './services/socket';
import { initTelegramBot }   from './services/telegram';
import { startScheduler }    from './services/scheduler';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';

const app = express();
const httpServer = http.createServer(app);

// ── Socket.IO ──
const io = new Server(httpServer, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST'],
  },
});
initSocket(io);

// ── Middleware ──
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));
app.use(rateLimiter);

// ── Health check ──
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0', service: 'МОТОР API' });
});

// ── API Routes ──
const api = express.Router();
api.use('/auth',     authRouter);
api.use('/orders',   ordersRouter);
api.use('/booking',  bookingRouter);
api.use('/diag',     diagRouter);
api.use('/loyalty',     loyaltyRouter);
api.use('/integration', integrationRouter);
api.use('/chat',     chatRouter);
api.use('/parts',    partsRouter);
api.use('/warehouse', warehouseRouter);
api.use('/finance',   financeRouter);
api.use('/booking',  bookingRouter);
api.use('/diag',     diagRouter);
api.use('/loyalty',     loyaltyRouter);
api.use('/integration', integrationRouter);
api.use('/users',    usersRouter);
api.use('/pipeline', pipelineRouter);
api.use('/payments', paymentRouter);
api.use('/admin',      adminRouter);
api.use('/analytics',   analyticsRouter);
api.use('/onboarding',  onboardingRouter);
api.use('/settings',    settingsRouter);
api.use('/export',   exportRouter);

app.use('/api/v1', api);

// ── Error handler ──
app.use(errorHandler);

// ── Start ──
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  initTelegramBot().catch(console.error);
  startScheduler();
  console.log(`\n🔧 МОТОР API запущен на порту ${PORT}`);
  console.log(`   http://localhost:${PORT}/health\n`);
});

export { io };
