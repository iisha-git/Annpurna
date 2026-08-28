import bcrypt from 'bcryptjs';
import { connect, disconnect } from 'mongoose';

import { MONGODB_URI, OWNER_EMAIL, OWNER_NAME, OWNER_PASSWORD } from './config.js';
import { Owner } from './models/Owner.js';
import { seedDefaults } from './seed.js';

const IS_SECURE = OWNER_PASSWORD && OWNER_PASSWORD.length >= 8;

(async () => {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI is not set. Copy .env.example to .env first.');
    process.exit(1);
  }
  if (!OWNER_EMAIL || !OWNER_PASSWORD) {
    console.error('OWNER_EMAIL and OWNER_PASSWORD must be set in .env.');
    process.exit(1);
  }
  if (!IS_SECURE) {
    console.error('OWNER_PASSWORD must be at least 8 characters.');
    process.exit(1);
  }

  await connect(MONGODB_URI);
  await Owner.updateOne(
    { email: OWNER_EMAIL },
    {
      $set: {
        email: OWNER_EMAIL,
        name: OWNER_NAME,
        passwordHash: await bcrypt.hash(OWNER_PASSWORD, 10),
      },
    },
    { upsert: true }
  );
  console.log(`Owner ready: ${OWNER_EMAIL}`);
  await seedDefaults();
  await disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});