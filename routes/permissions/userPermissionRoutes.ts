import { Router } from 'express';
import {
  assignPermissionToUser,
  getUserPermissions,
  updateUserPermission,
  removePermissionFromUser,
} from '../../controllers/permissions/userPermissionController.ts';

const router = Router();

router.post('/', assignPermissionToUser);
router.get('/:userId', getUserPermissions);
router.put('/:id', updateUserPermission);
router.delete('/:userId/:permissionId', removePermissionFromUser);

export default router;
