import { Router } from 'express';
import { addAttachments } from '../../controllers/dbms/attachmentController.ts';

const router = Router();

router.post('/:questionId/attachments', addAttachments);
console.log("📦 attachmentRoutes loaded");

export default router;
