import express from "express";
import {
    getUserEnrollments,
    getUserEnrolledCourses,
    addUserEnrollment,
    removeUserEnrollment,
    updateLastOpenedCourse,
    getLastOpenedCourse,
} from "../../controllers/courses/courseEnrollmentController.ts";

const router = express.Router();

// static routes first
router.post("/last-opened-course", updateLastOpenedCourse);
router.get("/last-opened-course/:userId", getLastOpenedCourse);

router.get("/:userId/courses", getUserEnrolledCourses); 
router.get("/:userId", getUserEnrollments);  // minimal info
router.post("/", addUserEnrollment);         // admin/manual enrollment
router.delete("/:id", removeUserEnrollment); // remove enrollment

export default router;
