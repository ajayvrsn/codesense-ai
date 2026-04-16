import pg from 'pg';
import dotenv from 'dotenv';
import net from 'net';

dotenv.config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error('CRITICAL: DATABASE_URL environment variable is missing.');
  console.error('Please add it to your environment variables.');
}

const rawUrl = process.env.DATABASE_URL || '';
const cleanUrl = rawUrl.trim().replace(/^["']|["']$/g, '').trim();

if (cleanUrl && !cleanUrl.startsWith('postgres')) {
  console.error('CRITICAL: DATABASE_URL does not start with postgresql://');
}

// Supabase IPv6 Fix: Force IPv4 if using the direct port 5432
const isSupabaseDirect = cleanUrl.includes('supabase.co') && cleanUrl.includes(':5432');

const pool = new Pool({
  connectionString: cleanUrl,
  ssl: cleanUrl.includes('supabase.co') ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 10000,
  // Force IPv4 for Supabase direct connections to bypass IPv6 resolution issues
  // @ts-ignore - stream is supported in pg Client options
  stream: isSupabaseDirect ? (prop: any) => {
    return net.connect({ port: prop.port, host: prop.host, family: 4 });
  } : undefined
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export async function initDb() {
  if (!process.env.DATABASE_URL) return;
  
  try {
    const client = await pool.connect();
    console.log('Successfully connected to PostgreSQL');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255),
        google_id VARCHAR(255) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    client.release();
    console.log('Database schema verified/initialized');
  } catch (err) {
    console.error('Error initializing database connection:', err);
    console.error('Check if your DATABASE_URL is correct and accessible.');
  }
}
