// Import the Pool class from the 'pg' module for PostgreSQL connections
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();  // Load environment variables from .env file

// Create a new connection pool using the DATABASE_URL from environment variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export default pool;  // Export the pool to use it in other modules
