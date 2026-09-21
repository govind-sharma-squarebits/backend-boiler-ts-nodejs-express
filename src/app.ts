import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler } from './shared/middleware/errorHandler';
import { registerRoutes } from './routes';

const app = express();

// Needed for correct client IPs / rate limits behind nginx, ALB, etc.
app.set('trust proxy', 1);

app.use(helmet());

/**
 * CORS + cookie auth:
 * - credentials: true is required for the browser to send the refresh cookie.
 * - Frontend must use fetch(..., { credentials: 'include' }) / axios withCredentials.
 * - Origin must be an exact allowlisted value (not '*') when credentials are used.
 */
const origins = env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean);
app.use(
  cors({
    origin: origins.length === 1 ? origins[0] : origins,
    credentials: true,
  })
);

app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

registerRoutes(app);
app.use(errorHandler);

export default app;
