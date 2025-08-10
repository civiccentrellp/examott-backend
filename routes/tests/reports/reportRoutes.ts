import express from "express";
import {
  reportQuestion,
  getAllReportedQuestions,
  getReportsByUser,
  resolveReportedQuestion,
  getAllResolvedReports,
  getResolvedReportsByUser,
  dismissReportedQuestion,
} from "../../../controllers/tests/reports/reportController.ts";
import { authenticate } from "../../../middlewares/auth.ts";

const router = express.Router();

router.post("/", authenticate, reportQuestion);

router.get("/", authenticate, getAllReportedQuestions);

router.get("/user", authenticate, getReportsByUser);

router.get("/resolved", authenticate, getAllResolvedReports);

router.get("/user/resolved", authenticate, getResolvedReportsByUser);

router.put("/:reportId/resolve", authenticate, resolveReportedQuestion);

router.put("/:reportId/dismiss", authenticate, dismissReportedQuestion);

export default router;
