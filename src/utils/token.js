
require("dotenv").config();

const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const ISSUER = process.env.JWT_ISSUER;
const AUDIENCE = process.env.JWT_AUDIENCE;

function getSecret(name) {
  const secret = process.env[name];

  if (!secret || secret.length < 32) {
    throw new Error(`${name} must contain at least 32 characters`);
  }

  return secret;
}

function generateAccessToken(user) {
  return jwt.sign(
    {
      role: user.role,
      type: "access",
    },
    getSecret("JWT_ACCESS_SECRET"),
    {
      subject: String(user.id),
      expiresIn: "15m",
      algorithm: "HS256",
      issuer: ISSUER,
      audience: AUDIENCE,
    }
  );
}

function generateRefreshToken(user, familyId) {
  if (!familyId) {
    throw new Error("Refresh-token family ID is required");
  }

  return jwt.sign(
    {
      type: "refresh",
      familyId,
      jti: crypto.randomUUID(),
    },
    getSecret("JWT_REFRESH_SECRET"),
    {
      subject: String(user.id),
      expiresIn: "7d",
      algorithm: "HS256",
      issuer: ISSUER,
      audience: AUDIENCE,
    }
  );
}

function verifyAccessToken(token) {
  const payload = jwt.verify(token, getSecret("JWT_ACCESS_SECRET"), {
    algorithms: ["HS256"],
    issuer: ISSUER,
    audience: AUDIENCE,
  });

  if (payload.type !== "access") {
    throw new Error("Invalid access token type");
  }

  return payload;
}

function verifyRefreshToken(token) {
  const payload = jwt.verify(token, getSecret("JWT_REFRESH_SECRET"), {
    algorithms: ["HS256"],
    issuer: ISSUER,
    audience: AUDIENCE,
  });

  if (
    payload.type !== "refresh" ||
    typeof payload.familyId !== "string" ||
    typeof payload.sub !== "string" ||
    typeof payload.jti !== "string"
  ) {
    throw new Error("Invalid refresh token");
  }

  return payload;
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
