import 'dotenv/config';

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

import * as schema from '@/db/schema';
import { env } from '@/config/env';

export const pool = mysql.createPool(env.DATABASE_URL);

export const db = drizzle({ client: pool, schema, mode: 'default' });

export { schema };
