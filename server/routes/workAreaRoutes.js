const express = require("express");
const pool = require("../db");

const router = express.Router();

const colors = new Set(["purple", "green", "orange", "gray"]);

function validateWorkArea(body) {
  const name = body.name?.trim();
  const requiredPeople = Number(body.requiredPeople);

  if (!name) return { error: "Work type name is required." };
  if (!Number.isInteger(requiredPeople) || requiredPeople < 1) {
    return { error: "Required people must be a positive whole number." };
  }

  return {
    value: {
      name,
      requiredPeople,
      isRemaining: Boolean(body.isRemaining),
      status: body.status === "inactive" ? "inactive" : "active",
      color: colors.has(body.color) ? body.color : "purple",
    },
  };
}

const returningFields = `
  id, name, required_people AS "requiredPeople",
  is_remaining AS "isRemaining", display_order AS "displayOrder",
  status, color
`;

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        required_people AS "requiredPeople",
        is_remaining AS "isRemaining",
        display_order AS "displayOrder",
        status,
        color
      FROM work_areas
      ORDER BY display_order ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Failed to load work areas:", error);

    res.status(500).json({
      message: "Unable to load work areas.",
    });
  }
});

router.post("/", async (req, res) => {
  const validation = validateWorkArea(req.body);
  if (validation.error) return res.status(400).json({ message: validation.error });

  const { name, requiredPeople, isRemaining, status, color } = validation.value;
  try {
    const result = await pool.query(
      `INSERT INTO work_areas (name, required_people, is_remaining, display_order, status, color)
       VALUES ($1, $2, $3, (SELECT COALESCE(MAX(display_order), 0) + 1 FROM work_areas), $4, $5)
       RETURNING ${returningFields}`,
      [name, requiredPeople, isRemaining, status, color]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") return res.status(409).json({ message: "That work type already exists." });
    console.error("Failed to add work area:", error);
    res.status(500).json({ message: "Unable to add the work type." });
  }
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ message: "Invalid work type ID." });
  const validation = validateWorkArea(req.body);
  if (validation.error) return res.status(400).json({ message: validation.error });

  const { name, requiredPeople, isRemaining, status, color } = validation.value;
  try {
    const result = await pool.query(
      `UPDATE work_areas SET name=$1, required_people=$2, is_remaining=$3,
       status=$4, color=$5, updated_at=CURRENT_TIMESTAMP WHERE id=$6
       RETURNING ${returningFields}`,
      [name, requiredPeople, isRemaining, status, color, id]
    );
    if (!result.rowCount) return res.status(404).json({ message: "Work type not found." });
    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") return res.status(409).json({ message: "That work type already exists." });
    console.error("Failed to update work area:", error);
    res.status(500).json({ message: "Unable to update the work type." });
  }
});

router.patch("/:id/status", async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body;
  if (!Number.isInteger(id)) return res.status(400).json({ message: "Invalid work type ID." });
  if (!["active", "inactive"].includes(status)) return res.status(400).json({ message: "Invalid status." });
  try {
    const result = await pool.query(
      `UPDATE work_areas SET status=$1, updated_at=CURRENT_TIMESTAMP WHERE id=$2 RETURNING ${returningFields}`,
      [status, id]
    );
    if (!result.rowCount) return res.status(404).json({ message: "Work type not found." });
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Failed to change work area status:", error);
    res.status(500).json({ message: "Unable to change the work type status." });
  }
});

module.exports = router;
