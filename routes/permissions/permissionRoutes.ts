import { Router } from 'express';
import {
  createPermission,
  getAllPermissions,
  updatePermission,
  deletePermission,
} from '../../controllers/permissions/permissionController.ts';

const router = Router();

router.post('/', createPermission);
router.get('/', getAllPermissions);
router.put('/:id', updatePermission);
router.delete('/:id', deletePermission);

export default router;
