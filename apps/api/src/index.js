import cors from 'cors';
import express from 'express';
import mongoose, { connect } from 'mongoose';

import { MONGODB_URI, PORT } from './config.js';
import { seedDefaults } from './seed.js';
import authRoutes from './routes/auth.js';
import leaveRoutes from './routes/leaves.js';
import menuRoutes from './routes/menu.js';
import studentRoutes from './routes/students.js';
import reviewRoutes from './routes/reviews.js';
import workerRoutes from './routes/workers.js';
import inventoryRoutes from './routes/inventory.js';
import feeRoutes from './routes/fees.js';

const app = express();

// Enable CORS for all origins and headers (needed for Vercel & Mobile apps)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Base status and health check routes
app.get('/', (_req, res) => res.json({
  status: 'online',
  service: 'Annpurna API',
  version: '1.0.1',
  mode: process.env.VERCEL ? 'serverless' : 'standalone',
  health: '/api/health',
  timestamp: new Date().toISOString()
}));

app.get('/api/health', (_req, res) => res.json({ 
  ok: true, 
  dbState: mongoose.connection.readyState === 1 ? 'connected' : 'connecting',
  timestamp: new Date().toISOString() 
}));

// Cached database connection for Vercel Serverless & Standalone Node
let isConnected = false;
let connectingPromise = null;

export async function ensureConnected() {
  if (isConnected || mongoose.connection.readyState === 1) {
    isConnected = true;
    return;
  }

  if (!connectingPromise) {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not set. Please configure it in your Vercel/environment settings.');
    }

    connectingPromise = connect(MONGODB_URI)
      .then(async (m) => {
        isConnected = true;
        connectingPromise = null;
        // Seed default workers & inventory if missing
        await seedDefaults().catch((err) => console.error('[seed warning]', err.message));
        return m;
      })
      .catch((err) => {
        connectingPromise = null;
        throw err;
      });
  }

  return connectingPromise;
}

// Ensure database is connected before processing any /api request
app.use(async (req, _res, next) => {
  // Skip DB connection for basic root/health check
  if (req.path === '/' || req.path === '/api/health') return next();

  try {
    await ensureConnected();
    next();
  } catch (err) {
    console.error('Database connection failed:', err);
    next(err);
  }
});

// Mounted API routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/fees', feeRoutes);

// 404 handler
app.use((_req, res) => res.status(404).json({ error: 'Not found.' }));

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error.' });
});

// If running standalone (local dev, Render, Docker), start the HTTP listener
if (!process.env.VERCEL) {
  ensureConnected()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Annpurna API listening on http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error('Startup connection failed:', err);
    });
}

// Export default app for Vercel Serverless Function runtime
export default app;