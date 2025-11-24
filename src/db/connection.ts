import { Pool, Client } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export { pool };

export async function testConnection() {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT NOW()');
    console.log('✓ Database connected:', result.rows[0]);
    return true;
  } catch (err) {
    console.error('✗ Database connection failed:', err);
    return false;
  } finally {
    client.release();
  }
}
