require("dotenv").config();

const cors = require("cors");
const express = require("express");
const fs = require("fs/promises");
const path = require("path");

const pool = require("./db");
const staffRoutes = require("./routes/staffRoutes");
const workAreaRoutes = require("./routes/workAreaRoutes");

const app = express();
const port = process.env.PORT || 4000;

app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        "http://localhost:5173",
        process.env.FRONTEND_URL,
      ].filter(Boolean);

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("CORS policy denied this origin."));
    },
  })
);

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Staff Rotation Scheduler API",
  });
});

app.use("/api/staff", staffRoutes);
app.use("/api/work-areas", workAreaRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found.",
  });
});

app.use((error, req, res, next) => {
  console.error("Unhandled server error:", error);

  res.status(500).json({
    message: "An unexpected server error occurred.",
  });
});

async function startServer() {
  try {
    const schema = await fs.readFile(path.join(__dirname, "schema.sql"), "utf8");
    await pool.query(schema);

    app.listen(port, "0.0.0.0", () => {
      console.log(`Server running at http://0.0.0.0:${port}`);
    });
  } catch (error) {
    console.error("Unable to initialize the database:", error);
    process.exitCode = 1;
  }
}

startServer();
