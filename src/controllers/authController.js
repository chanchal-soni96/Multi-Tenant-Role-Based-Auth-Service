
const { registerUser, loginUser } = require("../services/authService");

const {
  accessCookieOptions,
  refreshCookieOptions,
} = require("../utils/cookies");

const { pool } = require("../config/db");

const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/token");

const {
  rotateRefreshToken,
} = require("../services/refreshTokenService");

// Register a new user
async function register(req, res, next) {
  try {
    const name =
      typeof req.body?.name === "string"
        ? req.body.name.trim()
        : "";

    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    const password = req.body?.password;

    // Validate required fields
    if (!name || !email || typeof password !== "string" || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    // Validate name
    if (
      name.length > 100 ||
      /[\u0000-\u001F\u007F<>]/.test(name)
    ) {
      return res.status(400).json({
        success: false,
        message: "Name contains unsupported characters",
      });
    }

    // Validate email length and format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (email.length > 254 || !emailPattern.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    // Validate password length
    if (password.length < 12 || password.length > 128) {
      return res.status(400).json({
        success: false,
        message: "Password must be between 12 and 128 characters",
      });
    }

    // Create the user
    const user = await registerUser({ name, email, password });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    if (error.statusCode === 409) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    return next(error);
  }
}

// Login an existing user
async function login(req, res, next) {
  try {
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    const password = req.body?.password;

    // Validate required fields
    if (!email || typeof password !== "string" || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Validate email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (email.length > 254 || !emailPattern.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    // Verify credentials and generate tokens
    const result = await loginUser({ email, password });

    // Set tokens in HttpOnly cookies
    res.cookie("accessToken", result.accessToken, accessCookieOptions);
    res.cookie("refreshToken", result.refreshToken, refreshCookieOptions);

    // Never expose JWTs in the JSON response
    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: result.user,
    });
  } catch (error) {
    if (error.statusCode === 401) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    return next(error);
  }
}

// Rotate a refresh token and issue new cookies
async function refresh(req, res, next) {
  const oldToken = req.cookies?.refreshToken;

  if (!oldToken) {
    return res.status(401).json({
      success: false,
      message: "Refresh token required",
    });
  }

  try {
    const payload = verifyRefreshToken(oldToken);

    const userResult = await pool.query(
      `SELECT id, name, email, role
       FROM users
       WHERE id = $1`,
      [payload.sub]
    );

    const user = userResult.rows[0];

    if (!user) {
      res.clearCookie("accessToken", accessCookieOptions);
      res.clearCookie("refreshToken", refreshCookieOptions);

      return res.status(401).json({
        success: false,
        message: "Invalid refresh session",
      });
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const newAccessToken = generateAccessToken(safeUser);

    const newRefreshToken = generateRefreshToken(
      safeUser,
      payload.familyId
    );

    const result = await rotateRefreshToken(
      oldToken,
      newRefreshToken,
      safeUser.id,
      payload.familyId
    );

    if (result !== 1) {
      res.clearCookie("accessToken", accessCookieOptions);
      res.clearCookie("refreshToken", refreshCookieOptions);

      return res.status(401).json({
        success: false,
        message:
          result === -2
            ? "Refresh-token reuse detected. Please log in again."
            : "Invalid or expired refresh session",
      });
    }

    res.cookie("accessToken", newAccessToken, accessCookieOptions);
    res.cookie("refreshToken", newRefreshToken, refreshCookieOptions);

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      user: safeUser,
    });
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError" ||
      error.name === "NotBeforeError"
    ) {
      res.clearCookie("accessToken", accessCookieOptions);
      res.clearCookie("refreshToken", refreshCookieOptions);

      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }

    return next(error);
  }
}


const {
  revokeRefreshTokenFamily,
} = require("../services/refreshTokenService");

// Logout and revoke the current refresh-token family
async function logout(req, res, next) {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      try {
        const payload = verifyRefreshToken(refreshToken);
        await revokeRefreshTokenFamily(payload.familyId);
      } catch (error) {
        // Even if the token is invalid or expired,
        // clear the browser cookies below.
        if (
          ![
            "JsonWebTokenError",
            "TokenExpiredError",
            "NotBeforeError",
          ].includes(error.name)
        ) {
          throw error;
        }
      }
    }

    res.clearCookie("accessToken", accessCookieOptions);
    res.clearCookie("refreshToken", refreshCookieOptions);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    return next(error);
  }
}


module.exports = { register, login, refresh, logout };