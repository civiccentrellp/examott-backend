import express from 'express';
import {
  createFreeMaterial,
  getAllFreeMaterials,
  deleteFreeMaterial,

  createFreeMaterialFolder,
  getAllFreeMaterialFolders,
  updateFreeMaterialFolder,
  deleteFreeMaterialFolder,

  createFreeMaterialContent,
  updateFreeMaterialContent,
  deleteFreeMaterialContent
} from '../../controllers/freeMaterial/freeMaterialController.ts';

const router = express.Router();

router.post('/', createFreeMaterial);
router.get('/', getAllFreeMaterials);
router.delete('/:id', deleteFreeMaterial);

router.post('/folders', createFreeMaterialFolder);
router.get('/folders', getAllFreeMaterialFolders);
router.put('/folder/:id', updateFreeMaterialFolder);
router.delete('/folder/:id', deleteFreeMaterialFolder);

router.post('/content', createFreeMaterialContent);
router.put('/content/:id', updateFreeMaterialContent);
router.delete('/content/:id', deleteFreeMaterialContent);

export default router;
