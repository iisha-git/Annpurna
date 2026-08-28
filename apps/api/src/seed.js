import bcrypt from 'bcryptjs';

import { OWNER_EMAIL, OWNER_NAME, OWNER_PASSWORD } from './config.js';
import { DEFAULT_WEEK } from './config/menuDefaults.js';
import { Menu } from './models/Menu.js';
import { Owner } from './models/Owner.js';

/**
 * Idempotent startup seed:
 *  1. Default weekly menu if the singleton doesn't exist yet.
 *  2. Owner account — only created when OWNER_PASSWORD is set to something
 *     other than the known-insecure default. Run `npm run seed` to (re)set
 *     the owner from .env explicitly.
 */
export async function seedDefaults() {
  const menu = await Menu.findById('current');
  if (!menu) {
    await Menu.create({ _id: 'current', ...DEFAULT_WEEK });
    console.log('[seed] default weekly menu created.');
  }

  const owner = await Owner.findOne({ email: OWNER_EMAIL });
  if (!owner && OWNER_PASSWORD && OWNER_PASSWORD !== 'changeme123') {
    await Owner.create({
      email: OWNER_EMAIL,
      name: OWNER_NAME,
      passwordHash: await bcrypt.hash(OWNER_PASSWORD, 10),
    });
    console.log(`[seed] owner created (${OWNER_EMAIL}).`);
  } else if (!owner) {
    console.warn('[seed] no owner yet — set OWNER_EMAIL + OWNER_PASSWORD in .env, then run `npm run seed`.');
  }
}