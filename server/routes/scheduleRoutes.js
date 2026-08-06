const express = require("express");
const pool = require("../db");

const router = express.Router();

const scheduleFields = `
  id,
  department,
  week_number AS "weekNumber",
  dates,
  rotation,
  created_at AS "createdAt"
`;

function validateSchedule(body) {
  const department = body.department?.trim();
  const weekNumber = Number(body.weekNumber);
  const dates = body.dates?.trim();
  const rotation = body.rotation;

  if (!department) return { error: "Department is required." };
  if (!Number.isInteger(weekNumber) || weekNumber < 1 || weekNumber > 53) {
    return { error: "Week number must be between 1 and 53." };
  }
  if (!dates) return { error: "Schedule dates are required." };
  if (!Array.isArray(rotation)) return { error: "Schedule rotation must be an array." };

  const legacyId = body.legacyId == null ? null : Number(body.legacyId);
  if (legacyId != null && !Number.isSafeInteger(legacyId)) {
    return { error: "Invalid legacy schedule ID." };
  }

  return { value: { department, weekNumber, dates, rotation, legacyId } };
}

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ${scheduleFields}
      FROM schedules
      ORDER BY created_at DESC, id DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Failed to load schedules:", error);
    res.status(500).json({ message: "Unable to load schedule history." });
  }
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id)) {
    return res.status(400).json({ message: "Invalid schedule ID." });
  }

  try {
    const result = await pool.query(
      `SELECT ${scheduleFields} FROM schedules WHERE id = $1`,
      [id]
    );
    if (!result.rowCount) {
      return res.status(404).json({ message: "Schedule not found." });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Failed to load schedule:", error);
    res.status(500).json({ message: "Unable to load the schedule." });
  }
});

router.post("/", async (req, res) => {
  const validation = validateSchedule(req.body);
  if (validation.error) {
    return res.status(400).json({ message: validation.error });
  }

  const { department, weekNumber, dates, rotation, legacyId } = validation.value;

  try {
    const result = await pool.query(
      `
        INSERT INTO schedules (department, week_number, dates, rotation, legacy_id, created_at)
        VALUES ($1, $2, $3, $4::jsonb, $5, COALESCE($6::timestamptz, CURRENT_TIMESTAMP))
        ON CONFLICT (legacy_id) DO UPDATE SET legacy_id = EXCLUDED.legacy_id
        RETURNING ${scheduleFields}
      `,
      [department, weekNumber, dates, JSON.stringify(rotation), legacyId, req.body.createdAt || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Failed to save schedule:", error);
    res.status(500).json({ message: "Unable to save the schedule." });
  }
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id)) {
    return res.status(400).json({ message: "Invalid schedule ID." });
  }

  try {
    const result = await pool.query(
      `DELETE FROM schedules WHERE id = $1 RETURNING ${scheduleFields}`,
      [id]
    );
    if (!result.rowCount) {
      return res.status(404).json({ message: "Schedule not found." });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Failed to delete schedule:", error);
    res.status(500).json({ message: "Unable to delete the schedule." });
  }
});

module.exports = router;
