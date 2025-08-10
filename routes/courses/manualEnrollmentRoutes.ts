import express from "express";
import {
  addManualEnrollment,
  approvePendingEnrollment,
  getAllEnrollments,
  getEnrollmentById,
  updateEnrollment,
  removeManualEnrollment,
} from "../../controllers/courses/manualEnrollmentController.ts";

const router = express.Router();

// Create manual enrollment (admin)
router.post("/", addManualEnrollment);

// Approve pending enrollment
router.post("/approve", approvePendingEnrollment);

// Read enrollments
router.get("/", getAllEnrollments);
router.get("/:id", getEnrollmentById);

// Update enrollment
router.put("/:id", updateEnrollment);

// Delete enrollment
router.delete("/:id", removeManualEnrollment);

export default router;
