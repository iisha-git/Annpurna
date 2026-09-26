import bcrypt from 'bcryptjs';

import { OWNER_EMAIL, OWNER_NAME, OWNER_PASSWORD } from './config.js';
import { DEFAULT_WEEK } from './config/menuDefaults.js';
import { Menu } from './models/Menu.js';
import { Owner } from './models/Owner.js';
import { Worker } from './models/Worker.js';
import { Inventory } from './models/Inventory.js';

const DEFAULT_WORKERS = [
  { name: 'Ramesh Kumar', role: 'Head Cook', salary: '₹18,000/month', mobile: '9823411234', status: 'Working' },
  { name: 'Sunita Devi', role: 'Kitchen Helper', salary: '₹13,500/month', mobile: '9823415678', status: 'On Leave' },
  { name: 'Mohan Lal', role: 'Cleaner', salary: '₹12,000/month', mobile: '9823419012', status: 'Working' },
  { name: 'Anita Kumari', role: 'Kitchen Helper', salary: '₹13,500/month', mobile: '9823413456', status: 'Working' },
  { name: 'Suresh Babu', role: 'Assistant Cook', salary: '₹16,000/month', mobile: '9823417890', status: 'Working' },
];
import { DEFAULT_INVENTORY } from './config/inventoryDefaults.js';

/**
 * Idempotent startup seed:
 *  1. Default weekly menu if the singleton doesn't exist yet.
 *  2. Owner account — only created when OWNER_PASSWORD is set.
 *  3. Default workers if collection is empty.
 *  4. Default inventory items if collection is empty.
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

  const workerCount = await Worker.countDocuments();
  if (workerCount === 0) {
    await Worker.insertMany(DEFAULT_WORKERS);
    console.log('[seed] default workers seeded.');
  }

  const inventoryCount = await Inventory.countDocuments();
  if (inventoryCount === 0) {
    await Inventory.insertMany(DEFAULT_INVENTORY);
    console.log('[seed] default inventory items seeded.');
  }
}