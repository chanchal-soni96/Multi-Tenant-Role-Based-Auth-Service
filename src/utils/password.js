
const argon2 = require("argon2");

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

async function hashPassword(password) {
  if (typeof password !== "string" || password.length === 0) {
    throw new Error("Password must be a non-empty string");
  }

  return argon2.hash(password, ARGON2_OPTIONS);
}

async function verifyPassword(hash, password) {
  if (typeof hash !== "string" || typeof password !== "string") {
    return false;
  }

  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

module.exports = {
  hashPassword,
  verifyPassword,
};
