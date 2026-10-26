
function getAdminDashboard(req, res) {
  return res.status(200).json({
    success: true,
    message: "Welcome to the admin dashboard",
    user: req.user,
  });
}

module.exports = { getAdminDashboard };
