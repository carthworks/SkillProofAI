import 'dotenv/config';
import path from 'path';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import passport from 'passport';
import http from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import './config/passport'; // Load Google strategy configuration
import authRoutes from './routes/auth';
import studentRoutes from './routes/student';
import internalRoutes from './routes/internal';
import verifyRoutes from './routes/verify';
import learningPathRoutes from './routes/learningPath';
import copilotRoutes from './routes/copilot';
import reviewerRoutes from './routes/reviewer';
import reviewsRoutes from './routes/reviews';
import employerRoutes from './routes/employers';
import paymentsRoutes from './routes/payments';
import lmsRoutes from './routes/lms';
import publicRoutes from './routes/public';
import { publicApiRateLimiter } from './middleware/rateLimiter';
import { AIAdapterFactory } from './services/ai/aiAdapterFactory';

// Sentry Observability Setup
if (process.env.SENTRY_DSN) {
  try {
    const Sentry = require('@sentry/node');
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 1.0,
    });
  } catch (err: any) {
    console.warn('[Backend] Sentry initialization failed (likely npm version mismatch), skipping observability:', err.message);
  }
}

const app = express();

if (process.env.SENTRY_DSN) {
  const Sentry = require('@sentry/node');
  // The request handler must be the first middleware on the app
  app.use(Sentry.Handlers.requestHandler());
  // TracingHandler creates a trace for every incoming request
  app.use(Sentry.Handlers.tracingHandler());
}

app.use(helmet());

// CORS allowlist
const allowedOrigins = [
  'http://localhost:5173',
  'https://beta.talentforge.com',
  process.env.CORS_ORIGIN
].filter(Boolean) as string[];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));

app.use(express.json());
app.use(passport.initialize());

// ─── Routes ──────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  const host = req.headers.host || 'localhost:5001';
  res.json({
    service: 'TalentForge Backend API',
    status: 'online',
    health: `http://${host}/health`,
    problemsApi: `http://${host}/api/students/problems`,
  });
});
app.use('/api/public', publicRoutes);
app.use('/api/auth',     authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/verify',   publicApiRateLimiter, verifyRoutes);
app.use('/api/learning-path', learningPathRoutes);
app.use('/api/copilot',  copilotRoutes);
app.use('/api/reviewer', reviewerRoutes);
app.use('/api/reviews',  reviewsRoutes);
app.use('/api/employers', publicApiRateLimiter, employerRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/lms',      lmsRoutes);
app.use('/internal',     internalRoutes);   // worker-only internal endpoints

// Serve uploaded files (resumes, etc.) as static assets
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get(['/health', '/api/health'], (req, res) => {
  let aiProvider = 'Unknown';
  try {
    aiProvider = AIAdapterFactory.getAdapter().getProviderName();
  } catch (e) {
    aiProvider = 'Error loading AI';
  }
  res.json({ status: 'ok', aiProvider, timestamp: new Date().toISOString() });
});


// ─── HTTP + Socket.io server ─────────────────────────────────────────────────
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Redis adapter: allows the worker's @socket.io/redis-emitter to publish
// events into socket.io rooms managed by this server.
async function setupRedisAdapter() {
  const redisUrl = process.env.REDIS_URL ?? 'redis://:redis_dev_secret@127.0.0.1:6380';


  const pubClient = createClient({
    url: redisUrl,
    socket: {
      connectTimeout: 2000,
      reconnectStrategy: false,
    },
  });
  const subClient = pubClient.duplicate();

  pubClient.on('error', (err) => console.error('[Redis Pub] Error:', err.message));
  subClient.on('error', (err) => console.error('[Redis Sub] Error:', err.message));

  // Add timeout guard so Express server ALWAYS starts even if Redis is down
  await Promise.race([
    Promise.all([pubClient.connect(), subClient.connect()]),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Redis connection timeout (2.5s)')), 2500)),
  ]);

  io.adapter(createAdapter(pubClient, subClient));
  console.log('Socket.io Redis adapter connected');
}

// Bind socket server to Express app context so controllers can emit events
app.set('io', io);

io.on('connection', (socket) => {
  console.log('Client connected to socket.io:', socket.id);

  // Candidates listen to grading changes by joining room submission:{submissionId}
  socket.on('join_submission', (submissionId: string) => {
    socket.join(`submission:${submissionId}`);
    console.log(`Socket ${socket.id} joined room submission:${submissionId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected from socket.io:', socket.id);
  });
});

if (process.env.SENTRY_DSN) {
  const Sentry = require('@sentry/node');
  // The error handler must be before any other error middleware and after all controllers
  app.use(Sentry.Handlers.errorHandler());
}

// ─── Start server ─────────────────────────────────────────────────────────────
const envPort = process.env.PORT ? parseInt(process.env.PORT, 10) : 5001;
const basePort = envPort === 3000 ? 5001 : envPort;
const portOptions = [basePort, basePort + 1, basePort + 2];

function startServer(index = 0) {
  if (index >= portOptions.length) {
    console.error(`Failed to bind backend server after trying ports: ${portOptions.join(', ')}`);
    process.exit(1);
  }

  const port = portOptions[index];

  const onError = (error: NodeJS.ErrnoException) => {
    server.removeListener('error', onError);
    if (error.code === 'EADDRINUSE' || error.code === 'EACCES') {
      console.warn(`Port ${port} unavailable (${error.code}). Trying port ${portOptions[index + 1]}...`);
      try { server.close(); } catch {}
      startServer(index + 1);
    } else {
      console.error(`Failed to start backend on port ${port}:`, error.message);
      process.exit(1);
    }
  };

  server.once('error', onError);

  server.listen(port, () => {
    server.removeListener('error', onError);
    console.log(`Backend running on http://localhost:${port}`);
  });
}

setupRedisAdapter()
  .then(() => startServer())
  .catch((err) => {
    console.warn('Redis adapter failed, running without adapter:', err.message);
    startServer();
  });
