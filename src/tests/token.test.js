
require("dotenv").config();

const jwt = require("jsonwebtoken");
const assert = require("node:assert/strict");

const {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} = require("../utils/token");

function expectFailure(fn) {
  assert.throws(fn);
}

function runTests() {
  const user = { id: 101, role: "user" };

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  const accessPayload = verifyAccessToken(accessToken);
  assert.equal(accessPayload.sub, "101");
  assert.equal(accessPayload.role, "user");
  assert.equal(accessPayload.type, "access");
  assert.ok(accessPayload.exp > accessPayload.iat);

  const refreshPayload = verifyRefreshToken(refreshToken);
  assert.equal(refreshPayload.sub, "101");
  assert.equal(refreshPayload.type, "refresh");

  // A refresh token must not work as an access token.
  expectFailure(() => verifyAccessToken(refreshToken));

  // A modified token must fail verification.
  const modifiedToken = accessToken + "tampered";
  expectFailure(() => verifyAccessToken(modifiedToken));

  // An expired token must be rejected.
  const expiredToken = jwt.sign(
    { type: "access" },
    process.env.JWT_ACCESS_SECRET,
    {
      subject: "101",
      expiresIn: "-1s",
      algorithm: "HS256",
      issuer: process.env.JWT_ISSUER,
      audience: process.env.JWT_AUDIENCE,
    }
  );

  expectFailure(() => verifyAccessToken(expiredToken));

  console.log("JWT signing and verification tests passed.");
}

try {
  runTests();
} catch (error) {
  console.error("JWT tests failed:", error.message);
  process.exitCode = 1;
}
