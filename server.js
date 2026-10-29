const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
const studentsRouter = require("./routes/students");
const authRouter = require("./routes/auth");
const facultyRouter = require("./routes/faculty");
const attendanceRouter = require("./routes/attendance");

app.use("/api/students", studentsRouter);
app.use("/api/auth", authRouter);
app.use("/api/faculty", facultyRouter);
app.use("/api/attendance", attendanceRouter);

const PORT = process.env.PORT || 3000;

let pool = null;
if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== "") {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === "true"
      ? { rejectUnauthorized: false }
      : undefined,
  });

  pool.on("error", (error) => {
    console.error("Unexpected PostgreSQL pool error:", error.message);
  });
}

app.get("/", (_req, res) => {
  res.json({
    message: "College Management System Backend is running!",
    status: "OK",
    endpoints: ["/api/health", "/api/db-health"],
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    status: "OK",
    message: "Backend is working properly",
    databaseConfigured: Boolean(pool),
  });
});

app.get("/api/db-health", async (_req, res) => {
  if (!pool) {
    return res.status(503).json({
      status: "NOT_CONFIGURED",
      message: "Database is not configured yet. Add DATABASE_URL to your .env file when ready.",
    });
  }

  try {
    const result = await pool.query("SELECT NOW() AS current_time");
    return res.json({
      status: "OK",
      message: "PostgreSQL connection successful",
      currentTime: result.rows[0].current_time,
    });
  } catch (error) {
    console.error("Database health check failed:", error.message);
    return res.status(500).json({
      status: "ERROR",
      message: "Could not connect to PostgreSQL. Check DATABASE_URL and database settings.",
    });
  }
});

app.use((req, res) => {
  res.status(404).json({
    status: "NOT_FOUND",
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

const server = app.listen(PORT, () => {
  console.log(`College Management System backend running at http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(pool
    ? "Database: DATABASE_URL is configured"
    : "Database: not configured yet (the server can still run)");
});

async function shutdown() {
  console.log("\nShutting down backend...");
  server.close(async () => {
    if (pool) {
      await pool.end();
    }
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

