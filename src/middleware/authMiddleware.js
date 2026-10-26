
const { verifyAccessToken } = require("../utils/token");

function authenticateToken(req, res, next) {
  try {
    // Read the access token from the HttpOnly cookie
    const token = req.cookies?.accessToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Verify signature, expiry, issuer, audience and token type
    const payload = verifyAccessToken(token);

    // Attach verified identity to the request
    req.user = {
      id: payload.sub,
      role: payload.role,
    };

    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired access token",
    });
  }
}

// Authorization middleware: restrict access by role
function authorizeRoles(...allowedRoles) {
  return function (req, res, next) {
    // Authentication middleware must run first
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this resource",
      });
    }

    return next();
  };
}

module.exports = { authenticateToken, authorizeRoles, };
