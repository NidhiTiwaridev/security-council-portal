const express = require("express");
const router = express.Router();
const pool = require("../db");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/auth");

router.use(authenticateToken);

// Allowed attendance statuses (lowercase)
const ALLOWED_STATUSES = ["present", "absent", "late", "excused"];

// Validate attendance request data
function validateAttendance(student_id, attendance_date, status) {
  if (
    student_id === undefined ||
    !Number.isInteger(Number(student_id)) ||
    Number(student_id) <= 0
  ) {
    return "A valid student_id is required";
  }

  if (
    typeof attendance_date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(attendance_date)
  ) {
    return "A valid attendance_date in YYYY-MM-DD format is required";
  }

  // Ensure the date is a real calendar date
  const date = new Date(`${attendance_date}T00:00:00Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== attendance_date
  ) {
    return "Invalid attendance date";
  }

  if (
    typeof status !== "string" ||
    !ALLOWED_STATUSES.includes(status.trim().toLowerCase())
  ) {
    return "Status must be present, absent, late, or excused";
  }

  return null;
}

// GET all attendance records
router.get(
  "/",
  authorizeRoles("faculty", "admin"),
  async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, s.full_name, s.student_number
      FROM attendance a
      JOIN students s ON s.id = a.student_id
      ORDER BY a.attendance_date DESC, a.id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Fetch attendance error:", error.message);
    res.status(500).json({ error: "Failed to fetch attendance" });
  }
});

// GET attendance records for one student
router.get("/student/:studentId", async (req, res) => {
  try {
    const studentId = Number(req.params.studentId);

    if (!Number.isInteger(studentId) || studentId <= 0) {
      return res.status(400).json({ error: "Invalid student ID" });
    }

    // Students can access only their own attendance.
    if (req.user.role === "student") {
      const ownership = await pool.query(
        `SELECT id
         FROM students
         WHERE id = $1 AND user_id = $2`,
        [studentId, req.user.id]
      );

      if (ownership.rows.length === 0) {
        return res.status(403).json({
          error: "You can only view your own attendance",
        });
      }
    }

    const result = await pool.query(
      `SELECT a.*, s.full_name, s.student_number
       FROM attendance a
       JOIN students s ON s.id = a.student_id
       WHERE a.student_id = $1
       ORDER BY a.attendance_date DESC, a.id DESC`,
      [studentId]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error("Fetch student attendance error:", error.message);
    return res.status(500).json({
      error: "Failed to fetch student attendance",
    });
  }
});


// GET one attendance record by ID
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: "Invalid attendance ID",
      });
    }

    const result = await pool.query(
      `SELECT a.*, s.full_name, s.student_number, s.user_id
       FROM attendance a
       JOIN students s ON s.id = a.student_id
       WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Attendance record not found",
      });
    }

    const attendance = result.rows[0];

    // Students can access only their own attendance.
    if (
      req.user.role === "student" &&
      String(attendance.user_id) !== String(req.user.id)
    ) {
      return res.status(403).json({
        error: "You can only view your own attendance",
      });
    }

    // Do not expose the internal user_id in the response.
    delete attendance.user_id;

    return res.json(attendance);
  } catch (error) {
    console.error("Fetch attendance record error:", error.message);

    return res.status(500).json({
      error: "Failed to fetch attendance record",
    });
  }
});


// CREATE an attendance record
router.post("/", authorizeRoles("faculty", "admin"), async (req, res) => {
  try {
    const { student_id, attendance_date, status } = req.body;

    const validationError = validateAttendance(
      student_id,
      attendance_date,
      status
    );

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const normalizedStatus = status.trim().toLowerCase();

    const result = await pool.query(
      `INSERT INTO attendance (student_id, attendance_date, status)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [Number(student_id), attendance_date, normalizedStatus]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create attendance error:", error.message);

    if (error.code === "23503") {
      return res.status(400).json({
        error: "The specified student does not exist"
      });
    }

    if (error.code === "23514") {
      return res.status(400).json({
        error: "Attendance status is not allowed by the database constraint"
      });
    }

    res.status(500).json({
      error: "Failed to create attendance record"
    });
  }
});

// UPDATE an attendance record
router.put(
  "/:id",
  authorizeRoles("faculty", "admin"),
  async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid attendance ID" });
    }

    const { student_id, attendance_date, status } = req.body;

    const validationError = validateAttendance(
      student_id,
      attendance_date,
      status
    );

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const normalizedStatus = status.trim().toLowerCase();

    const result = await pool.query(
      `UPDATE attendance
       SET student_id = $1,
           attendance_date = $2,
           status = $3
       WHERE id = $4
       RETURNING *`,
      [
        Number(student_id),
        attendance_date,
        normalizedStatus,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Attendance record not found"
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update attendance error:", error.message);

    if (error.code === "23503") {
      return res.status(400).json({
        error: "The specified student does not exist"
      });
    }

    if (error.code === "23514") {
      return res.status(400).json({
        error: "Attendance status is not allowed by the database constraint"
      });
    }

    res.status(500).json({
      error: "Failed to update attendance record"
    });
  }
});

// DELETE an attendance record
router.delete(
  "/:id",
  authorizeRoles("admin"),
  async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid attendance ID" });
    }

    const result = await pool.query(
      "DELETE FROM attendance WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Attendance record not found"
      });
    }

    res.json({ message: "Attendance record deleted successfully" });
  } catch (error) {
    console.error("Delete attendance error:", error.message);
    res.status(500).json({
      error: "Failed to delete attendance record"
    });
  }
});

module.exports = router;
