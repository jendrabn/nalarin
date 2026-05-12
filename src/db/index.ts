import 'dotenv/config';

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

import * as schema from '@/db/schema';
import { env } from '@/config/env';

const globalForDb = globalThis as typeof globalThis & {
  mysqlPool?: mysql.Pool;
};

export const pool =
  globalForDb.mysqlPool ??
  mysql.createPool({
    uri: env.DATABASE_URL,
    waitForConnections: true,
    connectionLimit: 10,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.mysqlPool = pool;
}

export const db = drizzle({ client: pool, schema, mode: 'default' });

export { schema };
