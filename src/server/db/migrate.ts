import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/vtaweb";

const migrationClient = postgres(connectionString, { max: 1 });

async function main() {
  console.log("Applying database migrations...");
  await migrate(drizzle(migrationClient), { migrationsFolder: './src/server/db/migrations' });
  console.log("✅ Migrations applied successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
