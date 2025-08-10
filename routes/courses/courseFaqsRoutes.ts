import express from "express";
import {
  getCourseFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
} from "../../controllers/courses/courseFaqsController.ts";

const router = express.Router();

// Fetch all FAQs for a course
router.get("/:courseId/faqs", getCourseFaqs);

// Create new FAQ
router.post("/:courseId/faqs", createFaq);

// Update existing FAQ
router.put("/faqs/:id", updateFaq);

// Delete FAQ
router.delete("/faqs/:id", deleteFaq);

export default router;
