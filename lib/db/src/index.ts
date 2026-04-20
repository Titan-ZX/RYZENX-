export let db: any = null;

if (process.env.DATABASE_URL) {
  const { Pool } = pg;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle(pool, { schema });
} else {
  console.warn("⚠️ DATABASE_URL not set, DB disabled");
}
