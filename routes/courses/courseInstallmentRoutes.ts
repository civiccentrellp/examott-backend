import express from "express";
import {
  createInstallments,
  updateInstallment,
  deleteInstallment,
  getInstallmentsByPricingOption,
  getInstallmentsByCourse
} from "../../controllers/courses/courseInstallmentController.ts"
const router = express.Router();

router.get("/by-course/:courseId", getInstallmentsByCourse);
router.get("/:pricingOptionId", getInstallmentsByPricingOption);
router.post("/", createInstallments);
router.put("/:id", updateInstallment);
router.delete("/:id", deleteInstallment);

export default router;
