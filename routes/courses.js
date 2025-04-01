import express from "express";
import pool from "../db.js";  
import moment from "moment"; // Install using: npm install moment

const router = express.Router();

router.get("/courses", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM courses");

    const courses = rows.map(course => {
      const startDate = moment(course.startDate);
      const endDate = moment(course.endDate);
      const duration = endDate.diff(startDate, "months"); // Calculate duration in months

      return {
        ...course,
        duration: `${duration} months`  // Adding calculated duration
      };
    });

    res.json({ success: true, data: courses });
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ success: false, message: "Database query failed" });
  }
});

export default router;

