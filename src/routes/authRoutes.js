
const express = require("express");

const {
  register,
  login,
  refresh,
  logout,
} = require("../controllers/authController");

const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const { loginRateLimiter } = require("../middleware/rateLimiter");

const { getAdminDashboard } = require("../controllers/adminController");
const { getTenantRecord } = require("../controllers/tenantController");

const router = express.Router();

router.post("/register", register);
router.post("/login", loginRateLimiter, login);
router.post("/refresh", refresh);
router.post("/logout", logout);

router.get("/me", authenticateToken, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

router.get(
  "/admin",
  authenticateToken,
  authorizeRoles("admin"),
  getAdminDashboard
);

router.get("/records/:id", authenticateToken, getTenantRecord);

module.exports = router;
