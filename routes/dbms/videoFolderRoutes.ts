// routes/dbms/videoFolderRoutes.ts
import express from 'express';
import {
  createVideoFolder,
  getVideoFolders,
  deleteVideoFolder,
  updateVideoFolder,
} from '../../controllers/dbms/videoFolderController.ts';

const router = express.Router();

router.get('/', getVideoFolders);
router.post('/', createVideoFolder);
router.delete('/:id', deleteVideoFolder);
router.put('/:id', updateVideoFolder);

export default router;
