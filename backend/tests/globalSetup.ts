import pg from 'pg';

export default async function setup() {
  // This setup DROPs the whole public schema. Refuse to run against anything that isn't obviously a throwaway test database.
  const dbName = new URL(process.env.DATABASE_URL!).pathname.replace('/', '');
  if (!/test/i.test(dbName)) {
    throw new Error(`Refusing to run tests: database "${dbName}" does not look like a test database (its name must contain "test"). Set TEST_DATABASE_URL.`);
  }
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');   // fresh schema each run
  await pool.end();
  const { migrate } = await import('../src/migrate.js');
  await migrate(false);
  const { pool: appPool } = await import('../src/db.js');
  await appPool.end();
}
