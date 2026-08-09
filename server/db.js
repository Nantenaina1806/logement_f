const { Pool } = require('pg');
require('dotenv').config();

// Raha misy DATABASE_URL (ohatra amin'i Neon), dia io no ampiasaina mivantana,
// miaraka amin'ny SSL ilaina amin'ireo hébergeur cloud PostgreSQL.
// Raha tsy misy, dia ampiasaina ny variables tsotra (DB_USER, DB_HOST, sns.)
// toy ny amin'ny fampiasana eo an-toerana (local).
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  : new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    });

module.exports = pool;