import { Router } from 'express';
import { addOptions } from '../../controllers/dbms/optionController.ts';

const router = Router();

router.post('/:questionId/options', addOptions);

export default router;
