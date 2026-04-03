// config/db.js
const mysql  = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:             process.env.DB_HOST,
  port:             process.env.DB_PORT,
  user:             process.env.DB_USER,
  password:         process.env.DB_PASSWORD,
  database:         process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit:  10,
  queueLimit:       0,
  timezone:         '+00:00',   // store all timestamps in UTC
});

// Convenience wrapper — use this everywhere instead of pool.execute directly
async function query(sql, params) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

// Called once at startup to verify connection
async function testConnection() {
  const conn = await pool.getConnection();
  console.log('✅  MySQL connected successfully');
  conn.release();
}

module.exports = { pool, query, testConnection };