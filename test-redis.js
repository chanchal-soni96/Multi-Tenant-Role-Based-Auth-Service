
require("dotenv").config();

const redisClient = require("./src/config/redis");

async function testRedisConnection() {
  try {
    await redisClient.connect();

    await redisClient.set("auth-security-node-test", "connected");

    const value = await redisClient.get("auth-security-node-test");

    console.log("Redis test value:", value);

    if (value !== "connected") {
      throw new Error("Redis read/write test failed.");
    }

    console.log("Redis connection test passed.");
  } catch (error) {
    console.error("Redis connection test failed:", error.message);
    process.exitCode = 1;
  } finally {
    if (redisClient.isOpen) {
      await redisClient.quit();
    }
  }
}

testRedisConnection();
