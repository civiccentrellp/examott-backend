import { Router } from 'express';
import {
  assignPermissionToRole,
  getRolePermissions,
  updateRolePermission,
  removePermissionFromRole,
} from '../../controllers/permissions/rolePermissionController.ts';

const router = Router();

router.post('/', assignPermissionToRole);
router.get('/:roleId', getRolePermissions);
router.put('/:id', updateRolePermission);
router.delete('/:roleId/:permissionId', removePermissionFromRole);

export default router;
