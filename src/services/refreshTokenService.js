
const crypto = require("crypto");
const { redisClient, connectRedis } = require("../config/redis");

const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

function hashRefreshToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getRefreshTokenKey(token) {
  return `refresh-token:${hashRefreshToken(token)}`;
}

function getFamilyKey(familyId) {
  return `refresh-family:${familyId}`;
}

async function createRefreshTokenFamily(userId) {
  await connectRedis();

  const familyId = crypto.randomUUID();

  await redisClient.set(
    getFamilyKey(familyId),
    JSON.stringify({
      userId: String(userId),
      status: "active",
    }),
    { EX: REFRESH_TOKEN_TTL_SECONDS, NX: true }
  );

  return familyId;
}

async function storeRefreshToken(token, userId, familyId) {
  await connectRedis();

  const result = await redisClient.set(
    getRefreshTokenKey(token),
    JSON.stringify({
      userId: String(userId),
      familyId,
      status: "active",
    }),
    {
      EX: REFRESH_TOKEN_TTL_SECONDS,
      NX: true,
    }
  );

  if (result !== "OK") {
    throw new Error("Could not register refresh-token session");
  }
}

// Return codes:
//  1 = rotation succeeded
// -1 = token/session invalid or missing
// -2 = reused token; family revoked
// -3 = replacement-token key collision
async function rotateRefreshToken(oldToken, newToken, userId, familyId) {
  await connectRedis();

  const script = `
    local oldData = redis.call("GET", KEYS[1])

    if not oldData then
      return -1
    end

    local oldSession = cjson.decode(oldData)
    local familyData = redis.call("GET", KEYS[2])

    if not familyData then
      return -1
    end

    local family = cjson.decode(familyData)

    if oldSession.userId ~= ARGV[3]
       or oldSession.familyId ~= ARGV[4]
       or family.userId ~= ARGV[3] then
      return -1
    end

    if oldSession.status == "used" then
      family.status = "revoked"
      redis.call("SET", KEYS[2], cjson.encode(family), "KEEPTTL")
      return -2
    end

    if oldSession.status ~= "active" or family.status ~= "active" then
      return -1
    end

    if redis.call("EXISTS", KEYS[3]) == 1 then
      return -3
    end

    local newSession = cjson.encode({
      userId = ARGV[3],
      familyId = ARGV[4],
      status = "active"
    })

    oldSession.status = "used"

    redis.call("SET", KEYS[1], cjson.encode(oldSession), "KEEPTTL")
    redis.call("SET", KEYS[3], newSession, "EX", ARGV[2])

    return 1
  `;

  const result = await redisClient.eval(script, {
    keys: [
      getRefreshTokenKey(oldToken),
      getFamilyKey(familyId),
      getRefreshTokenKey(newToken),
    ],
    arguments: [
      String(userId),
      String(REFRESH_TOKEN_TTL_SECONDS),
      String(userId),
      familyId,
    ],
  });

  return Number(result);
}

async function revokeRefreshTokenFamily(familyId) {
  await connectRedis();

  const key = getFamilyKey(familyId);
  const data = await redisClient.get(key);

  if (!data) return false;

  const family = JSON.parse(data);
  family.status = "revoked";

  await redisClient.set(key, JSON.stringify(family), {
    KEEPTTL: true,
  });

  return true;
}

module.exports = {
  hashRefreshToken,
  getRefreshTokenKey,
  getFamilyKey,
  createRefreshTokenFamily,
  storeRefreshToken,
  rotateRefreshToken,
  revokeRefreshTokenFamily,
};
