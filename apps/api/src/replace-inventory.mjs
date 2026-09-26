import { connect, disconnect } from 'mongoose';
import { MONGODB_URI } from './config.js';
import { Inventory } from './models/Inventory.js';
import { Basket } from './models/Basket.js';
import { DEFAULT_INVENTORY } from './config/inventoryDefaults.js';

async function replaceInventory() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI is not set in environment or .env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await connect(MONGODB_URI);

  console.log('Deleting existing inventory and basket collections...');
  const deletedInv = await Inventory.deleteMany({});
  const deletedBasket = await Basket.deleteMany({});
  console.log(`Deleted ${deletedInv.deletedCount} inventory items and ${deletedBasket.deletedCount} basket items.`);

  console.log(`Inserting ${DEFAULT_INVENTORY.length} new inventory items...`);
  const inserted = await Inventory.insertMany(DEFAULT_INVENTORY);
  console.log(`Successfully inserted ${inserted.length} items into inventory.`);

  await disconnect();
  console.log('Done!');
}

replaceInventory().catch((err) => {
  console.error('Error replacing inventory:', err);
  process.exit(1);
});
