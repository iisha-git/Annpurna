import cors from 'cors';
import express from 'express';
import { connect } from 'mongoose';

import { MONGODB_URI, PORT } from './config.js';
import { seedDefaults } from './seed.js';
import authRoutes from './routes/auth.js';
import leaveRoutes from './routes/leaves.js';
import menuRoutes from './routes/menu.js';
import studentRoutes from './routes/students.js';
import reviewRoutes from './routes/reviews.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/reviews', reviewRoutes);

app.use((_req, res) => res.status(404).json({ error: 'Not found.' }));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error.' });
});

async function main() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI is not set. Copy .env.example to .env and add your Atlas connection string.');
    process.exit(1);
  }
  await connect(MONGODB_URI);
  await seedDefaults();
  app.listen(PORT, () => console.log(`Annpurna API listening on http://localhost:${PORT}`));
}

main();