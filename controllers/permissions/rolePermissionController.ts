import express from 'express';
import type { Request, Response } from 'express';
// import prisma from "../../prisma/prismaClient.js";
import prisma from '../../utils/prisma.js';

export const assignPermissionToRole = async (req: Request, res: Response) => {
  try {
    const { roleId, permissionId } = req.body;
    const rolePermission = await prisma.rolePermission.create({
      data: { roleId, permissionId },
    });
    res.json(rolePermission);
  } catch (err) {
    console.error('Assign permission error:', err);
    res.status(500).json({ error: 'Failed to assign permission to role' });
  }
};

export const getRolePermissions = async (req: Request, res: Response) => {
  try {
    const { roleId } = req.params;
    const permissions = await prisma.rolePermission.findMany({
      where: { roleId },
      include: { permission: true },
    });
    res.json(permissions);
  } catch (err) {
    console.error('Get role permissions error:', err);
    res.status(500).json({ error: 'Failed to fetch role permissions' });
  }
};

export const updateRolePermission = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { roleId, permissionId } = req.body;

    const updated = await prisma.rolePermission.update({
      where: { id },
      data: { roleId, permissionId },
    });

    res.json(updated);
  } catch (err) {
    console.error('Update role permission error:', err);
    res.status(500).json({ error: 'Failed to update role permission' });
  }
};

export const removePermissionFromRole = async (req: Request, res: Response) => {
  try {
    const { roleId, permissionId } = req.params;
    await prisma.rolePermission.deleteMany({ where: { roleId, permissionId } });
    res.json({ message: 'Permission removed from role' });
  } catch (err) {
    console.error('Remove permission error:', err);
    res.status(500).json({ error: 'Failed to remove permission' });
  }
};
