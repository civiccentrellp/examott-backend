import express from 'express';
import {
  createTest,
  getAllTests,
  getTestById,
  deleteTest,
  addQuestionsToSection,
  addSectionToTest,
  updateTest,
  updateSection,
  deleteSection,
  deleteQuestionFromSection,
  deleteTestQuestionById,
  updateTestQuestionMarks,
  getTestsByTag,
  getTestsByTags
} from '../../controllers/tests/testController.ts';

const router = express.Router();

router.get('/by-tag', getTestsByTag);
router.get('/by-tags', getTestsByTags);

router.put('/test-question/:id/marks', updateTestQuestionMarks);
router.delete('/test-questions/:id', deleteTestQuestionById);

router.put('/sections/:sectionId', updateSection);
router.delete('/sections/:sectionId', deleteSection);
router.post('/sections/:sectionId/questions', addQuestionsToSection);
router.delete('/sections/:sectionId/questions/:questionId', deleteQuestionFromSection);

router.post('/:testId/sections', addSectionToTest);
router.post('/', createTest);
router.get('/', getAllTests);

router.get('/:id', getTestById);
router.put('/:id', updateTest);
router.delete('/:id', deleteTest);

export default router;
