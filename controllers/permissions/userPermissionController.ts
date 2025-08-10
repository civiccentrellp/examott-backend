import express from 'express';
import type { Request, Response } from 'express';
// import prisma from "../../prisma/prismaClient.js";
import prisma from '../../utils/prisma.js';

export const assignPermissionToUser = async (req: Request, res: Response) => {
  try {
    const { userId, permissionId } = req.body;
    const userPermission = await prisma.userPermission.create({
      data: { userId, permissionId },
    });
    res.json(userPermission);
  } catch (err) {
    console.error('Assign user permission error:', err);
    res.status(500).json({ error: 'Failed to assign permission to user' });
  }
};

// export const getUserPermissions = async (req: Request, res: Response) => {
//   try {
//     const { userId } = req.params;
//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//       include: {
//         role: {
//           include: {
//             rolePermissions: { include: { permission: true } },
//           },
//         },
//         userPermissions: { include: { permission: true } },
//       },
//     });

//     const rolePermissions = user?.role?.rolePermissions.map(p => p.permission.name) || [];
//     const userPermissions = user?.userPermissions.map(p => p.permission.name) || [];
//     const allPermissions = [...new Set([...rolePermissions, ...userPermissions])];

//     res.json({ permissions: allPermissions });
//   } catch (err) {
//     console.error('Get user permissions error:', err);
//     res.status(500).json({ error: 'Failed to fetch user permissions' });
//   }
// };
export const getUserPermissions = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            rolePermissions: { include: { permission: true } },
          },
        },
        userPermissions: { include: { permission: true } },
      },
    });

    const rolePermissions = user?.role?.rolePermissions.map(p => ({
      id: p.permission.id,
      name: p.permission.name,
      label: p.permission.label,
    })) || [];

    const userPermissions = user?.userPermissions.map(p => ({
      id: p.permission.id,
      name: p.permission.name,
      label: p.permission.label,
    })) || [];

    res.json({
      rolePermissions,
      userPermissions,
    });
  } catch (err) {
    console.error('Get user permissions error:', err);
    res.status(500).json({ error: 'Failed to fetch user permissions' });
  }
};

export const updateUserPermission = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId, permissionId } = req.body;

    const updated = await prisma.userPermission.update({
      where: { id },
      data: { userId, permissionId },
    });

    res.json(updated);
  } catch (err) {
    console.error('Update user permission error:', err);
    res.status(500).json({ error: 'Failed to update user permission' });
  }
};

export const removePermissionFromUser = async (req: Request, res: Response) => {
  try {
    const { userId, permissionId } = req.params;
    await prisma.userPermission.deleteMany({ where: { userId, permissionId } });
    res.json({ message: 'Permission removed from user' });
  } catch (err) {
    console.error('Remove user permission error:', err);
    res.status(500).json({ error: 'Failed to remove permission' });
  }
};
