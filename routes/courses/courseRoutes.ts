import { Router } from "express";
import {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  updateCoursePricingOption,
} from "../../controllers/courses/courseController.ts";
import { authenticate } from "../../middlewares/auth.ts";

const router = Router();

router.get("/", authenticate, getAllCourses);
router.get("/:id", authenticate, getCourseById);
router.post("/", createCourse);
router.put("/:id", updateCourse);
router.delete("/:id", deleteCourse);
router.put("/pricing/:id", updateCoursePricingOption); 


export default router;
