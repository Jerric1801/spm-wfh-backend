import { Pool } from 'pg';
import config from '../../config/default'; // Assuming you have your configuration file in the config folder

// Create a pool using the database configuration from config/default.ts
const pool = new Pool({
  user: config.pgUser,
  host: config.pgHost || 'localhost',
  database: config.pgDatabase,
  password: config.pgPassword,
  port: config.pgPort || 5432,
  max: 10, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

export default pool;
