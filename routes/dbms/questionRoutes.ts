// routes/dbms/questions.ts
import express from 'express';
import { getAllQuestions, createQuestion, updateQuestion, deleteQuestion, getQuestionById } from '../../controllers/dbms/questionController.ts'
import { authenticate } from '../../middlewares/auth.ts'

const router = express.Router();

// add this tiny runtime guard
const requireUser: express.RequestHandler = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  next();
};

router.get('/', getAllQuestions);
// ⬇️ just remove AuthedRequest here
router.post('/', authenticate, requireUser, createQuestion);
router.put('/:id', authenticate, requireUser, updateQuestion);
router.delete('/:id', authenticate, requireUser, deleteQuestion);
router.get('/:id', getQuestionById);

export default router;
