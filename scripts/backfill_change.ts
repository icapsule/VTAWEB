import { db } from '../src/server/db';
import { rankings } from '../src/server/db/schema';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';
dotenv.config();

async function backfill() {
  console.log("Backfilling sample changes for Top players...");
  
  const updates = [
    { name: 'Jannik Sinner', change: 0 },
    { name: 'Carlos Alcaraz', change: 1 },
    { name: 'Novak Djokovic', change: -1 },
    { name: 'Alexander Zverev', change: 0 },
    { name: 'Daniil Medvedev', change: 2 },
    { name: 'Iga Swiatek', change: 0 },
    { name: 'Aryna Sabalenka', change: 1 },
    { name: 'Coco Gauff', change: -1 }
  ];

  for (const u of updates) {
    try {
      await db.update(rankings)
        .set({ change: u.change })
        .where(eq(rankings.name, u.name));
      console.log(`Updated ${u.name} with change ${u.change}`);
    } catch (err) {
      console.error(`Failed to update ${u.name}:`, err);
    }
  }
  
  console.log("Backfill complete.");
  process.exit(0);
}

backfill();
