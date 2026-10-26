
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || "auth_security",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error.message);
});

async function testDatabaseConnection() {
  const result = await pool.query(
    "SELECT current_database() AS database, NOW() AS server_time"
  );

  console.log("PostgreSQL connected successfully:", result.rows[0].database);
}

module.exports = {
  pool,
  testDatabaseConnection,
};
