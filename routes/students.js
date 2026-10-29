const express = require("express");
const router = express.Router();
const pool = require("../db");
const { authenticateToken } = require("../middleware/auth");

// Require authentication for every student endpoint
router.use(authenticateToken);

// GET all students
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM students ORDER BY id DESC"
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Fetch students error:", error.message);
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

// GET one student by ID
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM students WHERE id = $1",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Fetch student error:", error.message);
    res.status(500).json({ error: "Failed to fetch student" });
  }
});

// ADD a student
router.post("/", async (req, res) => {
  try {
    const {
      student_number,
      roll_number,
      full_name,
      email,
      phone,
      date_of_birth,
      gender,
      address,
      course_id,
      semester,
      admission_date
    } = req.body;

    const studentNumber = student_number || roll_number;

    if (
      typeof studentNumber !== "string" ||
      typeof full_name !== "string" ||
      !studentNumber.trim() ||
      !full_name.trim()
    ) {
      return res.status(400).json({
        error: "student_number and full_name are required"
      });
    }

    const result = await pool.query(
      `INSERT INTO students
       (
         student_number,
         full_name,
         email,
         phone,
         date_of_birth,
         gender,
         address,
         course_id,
         semester,
         admission_date
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        studentNumber.trim(),
        full_name.trim(),
        email || null,
        phone || null,
        date_of_birth || null,
        gender || null,
        address || null,
        course_id || null,
        semester ?? null,
        admission_date || null
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Add student error:", error.message);

    if (error.code === "23505") {
      return res.status(409).json({
        error: "That student number or email already exists"
      });
    }

    res.status(500).json({ error: "Failed to add student" });
  }
});

// UPDATE a student
router.put("/:id", async (req, res) => {
  try {
    const {
      student_number,
      roll_number,
      full_name,
      email,
      phone,
      date_of_birth,
      gender,
      address,
      course_id,
      semester,
      admission_date
    } = req.body;

    const studentNumber = student_number || roll_number;

    if (
      typeof studentNumber !== "string" ||
      typeof full_name !== "string" ||
      !studentNumber.trim() ||
      !full_name.trim()
    ) {
      return res.status(400).json({
        error: "student_number and full_name are required"
      });
    }

    const result = await pool.query(
      `UPDATE students
       SET student_number = $1,
           full_name = $2,
           email = $3,
           phone = $4,
           date_of_birth = $5,
           gender = $6,
           address = $7,
           course_id = $8,
           semester = $9,
           admission_date = $10
       WHERE id = $11
       RETURNING *`,
      [
        studentNumber.trim(),
        full_name.trim(),
        email || null,
        phone || null,
        date_of_birth || null,
        gender || null,
        address || null,
        course_id || null,
        semester ?? null,
        admission_date || null,
        req.params.id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update student error:", error.message);

    if (error.code === "23505") {
      return res.status(409).json({
        error: "That student number or email already exists"
      });
    }

    res.status(500).json({ error: "Failed to update student" });
  }
});

// DELETE a student
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM students WHERE id = $1 RETURNING id",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("Delete student error:", error.message);
    res.status(500).json({ error: "Failed to delete student" });
  }
});

module.exports = router;
