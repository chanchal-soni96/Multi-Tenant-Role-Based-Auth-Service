
require("dotenv").config();

const {
  pool,
  testDatabaseConnection,
} = require("../config/db");

async function runTest() {
  try {
    await testDatabaseConnection();
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

runTest();
