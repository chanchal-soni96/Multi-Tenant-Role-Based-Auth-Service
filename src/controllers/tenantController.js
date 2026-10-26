
const { pool } = require("../config/db");

async function getTenantRecord(req, res, next) {
  try {
    const recordId = req.params.id;
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT id, owner_id, title, created_at
       FROM tenant_records
       WHERE id = $1 AND owner_id = $2`,
      [recordId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    return res.status(200).json({
      success: true,
      record: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getTenantRecord };
