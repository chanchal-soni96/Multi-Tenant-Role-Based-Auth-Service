
const { redisClient, connectRedis } = require("../config/redis");

const WINDOW_SECONDS = 60;
const MAX_REQUESTS = 5;

const SLIDING_WINDOW_SCRIPT = `
  local key = KEYS[1]
  local now = tonumber(ARGV[1])
  local windowStart = now - tonumber(ARGV[2]) * 1000
  local maxRequests = tonumber(ARGV[3])
  local requestId = ARGV[4]
  local windowSeconds = tonumber(ARGV[2])

  redis.call("ZREMRANGEBYSCORE", key, "-inf", windowStart)

  local attempts = redis.call("ZCARD", key)

  if attempts >= maxRequests then
    local oldest = redis.call("ZRANGE", key, 0, 0, "WITHSCORES")
    local retryAfter = windowSeconds

    if oldest[2] then
      retryAfter = math.max(
        1,
        math.ceil((tonumber(oldest[2]) + windowSeconds * 1000 - now) / 1000)
      )
    end

    return {0, retryAfter}
  end

  redis.call("ZADD", key, now, requestId)
  redis.call("EXPIRE", key, windowSeconds)

  return {1, 0}
`;

async function loginRateLimiter(req, res, next) {
  try {
    const identifier = String(req.body?.email || "")
      .trim()
      .toLowerCase();

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    await connectRedis();

    const key = `rate-limit:login:${identifier}`;
    const now = Date.now();
    const requestId = `${now}:${Math.random()}`;

    const result = await redisClient.eval(SLIDING_WINDOW_SCRIPT, {
      keys: [key],
      arguments: [
        String(now),
        String(WINDOW_SECONDS),
        String(MAX_REQUESTS),
        requestId,
      ],
    });

    const [allowed, retryAfter] = result;

    if (Number(allowed) === 0) {
      res.set("Retry-After", String(retryAfter));

      return res.status(429).json({
        success: false,
        message: "Too many login attempts. Please try again later.",
        retryAfterSeconds: Number(retryAfter),
      });
    }

    return next();
  } catch (error) {
    console.error("Login rate limiter error:", error.message);

    return res.status(503).json({
      success: false,
      message: "Authentication service temporarily unavailable.",
    });
  }
}

module.exports = { loginRateLimiter };
