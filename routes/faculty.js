
const express = require("express");
const router = express.Router();
const pool = require("../db");
const { authenticateToken } = require("../middleware/auth");

// Require a valid JWT for all faculty endpoints
router.use(authenticateToken);

// GET all faculty members
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM faculty ORDER BY id DESC"
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Fetch faculty error:", error.message);
    res.status(500).json({ error: "Failed to fetch faculty" });
  }
});

// GET one faculty member by ID
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM faculty WHERE id = $1",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Faculty member not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Fetch faculty member error:", error.message);
    res.status(500).json({ error: "Failed to fetch faculty member" });
  }
});

// ADD a faculty member
router.post("/", async (req, res) => {
  try {
    const {
      employee_number,
      full_name,
      email,
      phone,
      designation,
      department_id
    } = req.body;

    if (
      typeof employee_number !== "string" ||
      typeof full_name !== "string" ||
      typeof email !== "string" ||
      !employee_number.trim() ||
      !full_name.trim() ||
      !email.trim()
    ) {
      return res.status(400).json({
        error: "employee_number, full_name, and email are required"
      });
    }

    const result = await pool.query(
      `INSERT INTO faculty
       (employee_number, full_name, email, phone, designation, department_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        employee_number.trim(),
        full_name.trim(),
        email.trim().toLowerCase(),
        phone || null,
        designation || null,
        department_id ?? null
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Add faculty error:", error.message);

    if (error.code === "23505") {
      return res.status(409).json({
        error: "Employee number or email already exists"
      });
    }

    if (error.code === "23503") {
      return res.status(400).json({
        error: "The specified department does not exist"
      });
    }

    res.status(500).json({ error: "Failed to add faculty member" });
  }
});

// UPDATE a faculty member
router.put("/:id", async (req, res) => {
  try {
    const {
      employee_number,
      full_name,
      email,
      phone,
      designation,
      department_id
    } = req.body;

    if (
      typeof employee_number !== "string" ||
      typeof full_name !== "string" ||
      typeof email !== "string" ||
      !employee_number.trim() ||
      !full_name.trim() ||
      !email.trim()
    ) {
      return res.status(400).json({
        error: "employee_number, full_name, and email are required"
      });
    }

    const result = await pool.query(
      `UPDATE faculty
       SET employee_number = $1,
           full_name = $2,
           email = $3,
           phone = $4,
           designation = $5,
           department_id = $6
       WHERE id = $7
       RETURNING *`,
      [
        employee_number.trim(),
        full_name.trim(),
        email.trim().toLowerCase(),
        phone || null,
        designation || null,
        department_id ?? null,
        req.params.id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Faculty member not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update faculty error:", error.message);

    if (error.code === "23505") {
      return res.status(409).json({
        error: "Employee number or email already exists"
      });
    }

    if (error.code === "23503") {
      return res.status(400).json({
        error: "The specified department does not exist"
      });
    }

    res.status(500).json({ error: "Failed to update faculty member" });
  }
});

// DELETE a faculty member
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM faculty WHERE id = $1 RETURNING id",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Faculty member not found" });
    }

    res.json({ message: "Faculty member deleted successfully" });
  } catch (error) {
    console.error("Delete faculty error:", error.message);

    if (error.code === "23503") {
      return res.status(409).json({
        error: "Cannot delete this faculty member because other records reference them"
      });
    }

    res.status(500).json({ error: "Failed to delete faculty member" });
  }
});

module.exports = router;
