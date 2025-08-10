import express from 'express';
import {
  startTestAttempt,
  saveStudentAnswer,
  submitTestAttempt,
  getTestResultByAttemptId,
  getUserResults,
  reportQuestion,
  getAllReportedQuestions,
  resolveReportedQuestion,
  dismissReportedQuestion,
  getAllResolvedReports,
} from '../../controllers/tests/attemptController.ts';
import { authenticate } from '../../middlewares/auth.ts';

const router = express.Router();

router.post('/start', authenticate, startTestAttempt);
router.post('/answer', authenticate, saveStudentAnswer);
router.post('/report', authenticate, reportQuestion);
router.post('/submit', authenticate, submitTestAttempt);

router.get('/reports', authenticate, getAllReportedQuestions);
router.put('/reports/:reportId/resolve', authenticate, resolveReportedQuestion);
router.put('/reports/:reportId/dismiss', dismissReportedQuestion);
router.get('/reports/resolved', getAllResolvedReports);


router.get('/user/all', authenticate, getUserResults);

router.get('/:attemptId', authenticate, getTestResultByAttemptId);

export default router;
