import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import { connect, disconnect } from 'mongoose';

import { JWT_SECRET, OWNER_EMAIL, OWNER_NAME, OWNER_PASSWORD } from './config.js';
import { Owner } from './models/Owner.js';
import { Student } from './models/Student.js';
import { seedDefaults } from './seed.js';

/**
 * Migrate the whole database to a target URI (Atlas).
 *
 *   node src/migrate-to-atlas.mjs <targetUri> <studentsJsonPath>
 *
 * - Upserts the owner from OWNER_EMAIL / OWNER_PASSWORD (if set, >= 8 chars).
 * - Seeds the default weekly menu.
 * - Upserts every student in <studentsJsonPath> (docs: { _id, name, year,
 *   branch, room, mobile, active }), preserving any existing claims.
 *
 * Safe to re-run — it only upserts and never drops data.
 */

const targetUri = process.argv[2];
const studentsFile = process.argv[3];

if (!targetUri) {
  console.error('Usage: node src/migrate-to-atlas.mjs <targetUri> [studentsJsonPath]');
  process.exit(1);
}

async function migrateStudents() {
  if (!studentsFile || !fs.existsSync(studentsFile)) {
    console.log('[migrate] no students file provided, skipping students.');
    return;
  }
  const list = JSON.parse(fs.readFileSync(studentsFile, 'utf8'));
  if (!Array.isArray(list)) {
    console.error('Students file must be a JSON array.');
    process.exit(1);
  }

  const bulk = list
    .map((s) => ({
      messNumber: String(s._id ?? s.messNumber ?? '').trim(),
      name: String(s.name ?? '').replace(/\s+/g, ' ').trim(),
      year: s.year || null,
      branch: s.branch || null,
      room: s.room || null,
      mobile: String(s.mobile ?? '').replace(/\D/g, '') || null,
      active: s.active !== false,
    }))
    .filter((s) => /^\d+$/.test(s.messNumber) && s.name && s.mobile?.length === 10);

  await Student.bulkWrite(
    bulk.map((s) => ({
      updateOne: {
        filter: { _id: s.messNumber },
        update: {
          $set: {
            name: s.name,
            mobile: s.mobile,
            year: s.year,
            branch: s.branch,
            room: s.room,
            active: s.active,
          },
          $unset: { removedAt: 1 },
        },
        upsert: true,
        setDefaultsOnInsert: true,
      },
    }))
  );

  const total = await Student.countDocuments();
  const claimed = await Student.countDocuments({ claimed: true });
  console.log(`[migrate] students upserted: ${bulk.length} | total: ${total} | claimed: ${claimed}`);
}

(async () => {
  console.log(`[migrate] connecting to ${targetUri.replace(/:\/\/[^@]+@/, '://***@')}`);
  await connect(targetUri);

  if (OWNER_EMAIL && OWNER_PASSWORD && OWNER_PASSWORD.length >= 8) {
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
    console.log(`[migrate] owner ready: ${OWNER_EMAIL}`);
  } else {
    console.log('[migrate] owner skipped — set OWNER_EMAIL/OWNER_PASSWORD (>= 8 chars) in .env');
  }

  await seedDefaults();
  console.log('[migrate] default weekly menu ensured.');

  await migrateStudents();
  await disconnect();
  console.log('[migrate] done.');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});