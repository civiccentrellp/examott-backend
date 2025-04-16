// import express from "express";
// import pool from "../db.js";
// import prisma from "../prisma/prismaClient.js";
// import moment from "moment"; // Install using: npm install moment

// const router = express.Router();

// router.get("/courses", async (req, res) => { 
//   try {
//     const [rows] = await pool.query("SELECT * FROM courses");

//     const courses = rows.map((course) => {
//       const startDate = moment(course.startDate);
//       const endDate = moment(course.endDate);
//       const duration = endDate.diff(startDate, "months"); // Calculate duration in months

//       return {
//         ...course,
//         duration: `${duration} months`, // Adding calculated duration
//       };
//     });

//     res.json({ success: true, data: courses });
//   } catch (error) {
//     console.error("Error fetching courses:", error);
//     res.status(500).json({ success: false, message: "Database query failed" });
//   }
// });

// // GET single course by ID
// router.get("/courses/:id", async (req, res) => {
//   const { id } = req.params;
//   try {
//     const [rows] = await pool.query("SELECT * FROM courses WHERE id = ?", [id]);

//     if (rows.length === 0) {
//       return res.status(404).json({ success: false, message: "Course not found" });
//     }

//     const course = rows[0];

//     const startDate = moment(course.startDate);
//     const endDate = moment(course.endDate);
//     const duration = endDate.diff(startDate, "months");

//     res.json({
//       success: true,
//       data: {
//         ...course,
//         duration: `${duration} months`,
//       },
//     });
//   } catch (err) {
//     console.error("Error fetching course:", err);
//     res.status(500).json({ success: false, message: "Database query failed" });
//   }
// });

// // CREATE a new course
// router.post("/courses", async (req, res) => {
//   const {
//     name,
//     description,
//     thumbnail,
//     videoUrl,
//     originalPrice,
//     discountedPrice,
//     startDate,
//     endDate,
//     status,
//   } = req.body;

//   try {
//     const course = await prisma.course.create({
//       data: {
//         name,
//         description,
//         thumbnail,
//         videoUrl,
//         originalPrice: parseFloat(originalPrice),
//         discountedPrice: parseFloat(discountedPrice),
//         startDate: new Date(startDate),  // Make sure it's a valid date
//         endDate: new Date(endDate),
//         status,
//       },
//     });

//     res.status(201).json({
//       success: true,
//       message: "Course created",
//       data: course,
//     });
//   } catch (err) {
//     console.error("Error creating course:", err);
//     res.status(500).json({ success: false, message: "Failed to add course" });
//   }
// });

// // UPDATE a course
// router.put("/courses/:id", async (req, res) => {
//   const { id } = req.params;
//   const {
//     name,
//     description,
//     thumbnail,
//     videoUrl,
//     originalPrice,
//     discountedPrice,
//     startDate,
//     endDate,
//     expiryDate,
//     status,
//   } = req.body;

//   try {
//     const [result] = await pool.query(
//       `UPDATE courses SET
//         name = ?,
//         description = ?,
//         thumbnail = ?,
//         videoUrl = ?,
//         originalPrice = ?,
//         discountedPrice = ?,
//         startDate = ?,
//         endDate = ?,
//         expiryDate = ?,
//         status = ?
//       WHERE id = ?`,
//       [
//         name,
//         description,
//         thumbnail,
//         videoUrl,
//         originalPrice,
//         discountedPrice,
//         startDate,
//         endDate,
//         expiryDate,
//         status,
//         id,
//       ]
//     );

//     if (result.affectedRows === 0) {
//       return res
//         .status(404)
//         .json({
//           success: false,
//           message: "Course not found or no changes made",
//         });
//     }

//     res.json({ success: true, message: "Course updated" });
//   } catch (err) {
//     console.error("Error updating course:", err);
//     res.status(500).json({ success: false, message: "Course update failed" });
//   }
// });

// // DELETE a course
// router.delete("/courses/:id", async (req, res) => {
//   const { id } = req.params;

//   try {
//     const [result] = await pool.query("DELETE FROM courses WHERE id = ?", [id]);

//     if (result.affectedRows === 0) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Course not found" });
//     }

//     res.json({ success: true, message: "Course deleted" });
//   } catch (err) {
//     console.error("Error deleting course:", err);
//     res.status(500).json({ success: false, message: "Course deletion failed" });
//   }
// });

// export default router;

import express from "express";
import prisma from "../prisma/prismaClient.js";
import moment from "moment"; // npm install moment

const router = express.Router();

// GET all courses
router.get("/courses", async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      orderBy: { createdAt: "desc" },
    });

    const enrichedCourses = courses.map((course) => {
      const duration = moment(course.endDate).diff(moment(course.startDate), "months");
      return {
        ...course,
        duration: `${duration} months`,
      };
    });

    res.json({ success: true, data: enrichedCourses });
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ success: false, message: "Database query failed" });
  }
});

// GET course by ID
router.get("/courses/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const course = await prisma.course.findUnique({ where: { id } });

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const duration = moment(course.endDate).diff(moment(course.startDate), "months");

    res.json({
      success: true,
      data: {
        ...course,
        duration: `${duration} months`,
      },
    });
  } catch (err) {
    console.error("Error fetching course:", err);
    res.status(500).json({ success: false, message: "Database query failed" });
  }
});

// CREATE course
router.post("/courses", async (req, res) => {
  const {
    name,
    description,
    thumbnail,
    videoUrl,
    originalPrice,
    discountedPrice,
    startDate,
    endDate,
    status,
  } = req.body;

  try {
    const duration = moment(endDate).diff(moment(startDate), "months");

    const course = await prisma.course.create({
      data: {
        name,
        description,
        thumbnail,
        videoUrl,
        originalPrice: parseFloat(originalPrice),
        discountedPrice: parseFloat(discountedPrice),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        duration: `${duration} months`,
        status,
      },
    });

    res.status(201).json({
      success: true,
      message: "Course created",
      data: course,
    });
  } catch (err) {
    console.error("Error creating course:", err);
    res.status(500).json({ success: false, message: "Failed to add course" });
  }
});

// UPDATE course
router.put("/courses/:id", async (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    thumbnail,
    videoUrl,
    originalPrice,
    discountedPrice,
    startDate,
    endDate,
    status,
  } = req.body;

  try {
    const duration = moment(endDate).diff(moment(startDate), "months");

    const course = await prisma.course.update({
      where: { id },
      data: {
        name,
        description,
        thumbnail,
        videoUrl,
        originalPrice: parseFloat(originalPrice),
        discountedPrice: parseFloat(discountedPrice),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        duration: `${duration} months`,
        status,
      },
    });

    res.json({ success: true, message: "Course updated", data: course });
  } catch (err) {
    console.error("Error updating course:", err);
    res.status(500).json({ success: false, message: "Course update failed" });
  }
});

// DELETE course
router.delete("/courses/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.course.delete({ where: { id } });
    res.json({ success: true, message: "Course deleted" });
  } catch (err) {
    console.error("Error deleting course:", err);
    res.status(500).json({ success: false, message: "Course deletion failed" });
  }
});

export default router;

