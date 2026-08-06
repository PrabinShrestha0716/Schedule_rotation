const express = require("express");
const pool = require("../db");

const router = express.Router();

function normalizeStatus(status) {
  return status === "inactive" ? "inactive" : "active";
}

function validateStaffInput(body) {
  const name = body.name?.trim();
  const department = body.department?.trim() || "RF";

  if (!name) {
    return {
      error: "Staff name is required.",
    };
  }

  return {
    value: {
      name,
      department,
      status: normalizeStatus(body.status),
    },
  };
}

/**
 * GET /api/staff
 * Optional query:
 * ?status=active
 * ?search=john
 */
router.get("/", async (req, res) => {
  try {
    const status = req.query.status;
    const search = req.query.search?.trim();

    const conditions = [];
    const values = [];

    if (status === "active" || status === "inactive") {
      values.push(status);
      conditions.push(`status = $${values.length}`);
    }

    if (search) {
      values.push(`%${search}%`);
      conditions.push(`name ILIKE $${values.length}`);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await pool.query(
      `
        SELECT
          id,
          name,
          department,
          status,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM staff_members
        ${whereClause}
        ORDER BY
          CASE WHEN status = 'active' THEN 0 ELSE 1 END,
          name ASC
      `,
      values
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Failed to retrieve staff:", error);

    res.status(500).json({
      message: "Unable to retrieve staff members.",
    });
  }
});

/**
 * GET /api/staff/:id
 */
router.get("/:id", async (req, res) => {
  try {
    const staffId = Number(req.params.id);

    if (!Number.isInteger(staffId)) {
      return res.status(400).json({
        message: "Invalid staff member ID.",
      });
    }

    const result = await pool.query(
      `
        SELECT
          id,
          name,
          department,
          status,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM staff_members
        WHERE id = $1
      `,
      [staffId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Staff member not found.",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Failed to retrieve staff member:", error);

    res.status(500).json({
      message: "Unable to retrieve the staff member.",
    });
  }
});

/**
 * POST /api/staff
 */
router.post("/", async (req, res) => {
  const validation = validateStaffInput(req.body);

  if (validation.error) {
    return res.status(400).json({
      message: validation.error,
    });
  }

  const { name, department, status } = validation.value;

  try {
    const result = await pool.query(
      `
        INSERT INTO staff_members (
          name,
          department,
          status
        )
        VALUES ($1, $2, $3)
        RETURNING
          id,
          name,
          department,
          status,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `,
      [name, department, status]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "That employee ID is already being used.",
      });
    }

    console.error("Failed to add staff member:", error);

    res.status(500).json({
      message: "Unable to add the staff member.",
    });
  }
});

/**
 * PUT /api/staff/:id
 */
router.put("/:id", async (req, res) => {
  const staffId = Number(req.params.id);

  if (!Number.isInteger(staffId)) {
    return res.status(400).json({
      message: "Invalid staff member ID.",
    });
  }

  const validation = validateStaffInput(req.body);

  if (validation.error) {
    return res.status(400).json({
      message: validation.error,
    });
  }

  const { name, department, status } = validation.value;

  try {
    const result = await pool.query(
      `
        UPDATE staff_members
        SET
          name = $1,
          department = $2,
          status = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING
          id,
          name,
          department,
          status,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `,
      [name, department, status, staffId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Staff member not found.",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "That employee ID is already being used.",
      });
    }

    console.error("Failed to update staff member:", error);

    res.status(500).json({
      message: "Unable to update the staff member.",
    });
  }
});

/**
 * PATCH /api/staff/:id/status
 */
router.patch("/:id/status", async (req, res) => {
  const staffId = Number(req.params.id);
  const status = req.body.status;

  if (!Number.isInteger(staffId)) {
    return res.status(400).json({
      message: "Invalid staff member ID.",
    });
  }

  if (status !== "active" && status !== "inactive") {
    return res.status(400).json({
      message: "Status must be active or inactive.",
    });
  }

  try {
    const result = await pool.query(
      `
        UPDATE staff_members
        SET
          status = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING
          id,
          name,
          department,
          status,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `,
      [status, staffId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Staff member not found.",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Failed to change staff status:", error);

    res.status(500).json({
      message: "Unable to change the staff member's status.",
    });
  }
});

module.exports = router;
