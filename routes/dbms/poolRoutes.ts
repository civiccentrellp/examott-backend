import { Router } from 'express';
import {
  addPool,
  addQuestionToPool,
  getPools,
  deletePool,
  removeQuestionFromPool,
} from '../../controllers/dbms/poolController.ts';

const router = Router();

router.post('/', addPool);
router.post('/:poolId/questions', addQuestionToPool);
router.get('/', getPools);
router.delete('/:id', deletePool);
router.delete('/:poolId/questions/:questionId', removeQuestionFromPool);


export default router;
