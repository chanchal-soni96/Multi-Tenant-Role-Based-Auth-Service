
const { pool } = require("../config/db");
const { hashPassword, verifyPassword} = require("../utils/password");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/token");

const {
  createRefreshTokenFamily,
  storeRefreshToken,
} = require("./refreshTokenService");

async function registerUser({ name, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await pool.query(
    "SELECT id FROM users WHERE email = $1",
    [normalizedEmail]
  );

  if (existingUser.rowCount > 0) {
    const error = new Error("Email is already registered");
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await hashPassword(password);

  try {
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, role, created_at`,
      [name.trim(), normalizedEmail, passwordHash]
    );

    return result.rows[0];
  } catch (error) {
    // Handle a duplicate email if two requests arrive concurrently.
    if (error.code === "23505") {
      const conflict = new Error("Email is already registered");
      conflict.statusCode = 409;
      throw conflict;
    }

    throw error;
  }
}


async function loginUser({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  const result = await pool.query(
    `SELECT id, name, email, password_hash, role
     FROM users
     WHERE email = $1`,
    [normalizedEmail]
  );

  const user = result.rows[0];

  // Use a generic error for unknown emails and incorrect passwords.
  if (!user) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const passwordIsValid = await verifyPassword(
    user.password_hash,
    password
  );

  if (!passwordIsValid) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

const accessToken = generateAccessToken(safeUser);
const familyId = await createRefreshTokenFamily(safeUser.id);
const refreshToken = generateRefreshToken(safeUser, familyId);


// Store the refresh token against its family
await storeRefreshToken(refreshToken, safeUser.id, familyId);


  return {
    user: safeUser,
    accessToken,
    refreshToken,
  };
}


module.exports = { registerUser, loginUser, };
