import express from 'express';
import type { Request, Response } from 'express';
// import prisma from "../../prisma/prismaClient.js";
import prisma from '../../utils/prisma.js';

// ✅ Create a new role
// export const createRole = async (req: Request, res: Response) => {
//   try {
//     const { name, label } = req.body;

//     const existingRole = await prisma.role.findUnique({ where: { name } });
//     if (existingRole) {
//       return res.status(400).json({ error: 'Role already exists' });
//     }

//     const role = await prisma.role.create({ data: { name, label } });
//     res.status(201).json(role);
//   } catch (err) {
//     console.error('Create role error:', err);
//     res.status(500).json({ error: 'Failed to create role' });
//   }
// };

// ✅ Get all roles
// export const getAllRoles = async (_: Request, res: Response) => {
//   try {
//     const roles = await prisma.role.findMany({ orderBy: { createdAt: 'desc' } });
//     res.json(roles);
//   } catch (err) {
//     console.error('Get roles error:', err);
//     res.status(500).json({ error: 'Failed to fetch roles' });
//   }
// };

export const getAllRoles = async (_: Request, res: Response) => {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    });

    const result = roles.map(role => ({
      id: role.id,
      name: role.name,
      label: role.label,
      createdAt: role.createdAt,
      permissions: role.rolePermissions.map(rp => ({
        id: rp.permission.id,
        name: rp.permission.name,
        label: rp.permission.label,
      })),
    }));

    res.json(result);
  } catch (err) {
    console.error('Get roles error:', err);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
};


// ✅ Get a single role by ID
// export const getRoleById = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const role = await prisma.role.findUnique({ where: { id } });

//     if (!role) {
//       return res.status(404).json({ error: 'Role not found' });
//     }

//     res.json(role);
//   } catch (err) {
//     console.error('Get role by ID error:', err);
//     res.status(500).json({ error: 'Failed to fetch role' });
//   }
// };

export const getRoleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    });

    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    const formatted = {
      id: role.id,
      name: role.name,
      label: role.label,
      createdAt: role.createdAt,
      permissions: role.rolePermissions.map(rp => ({
        id: rp.permission.id,
        name: rp.permission.name,
        label: rp.permission.label,
      })),
    };

    res.json(formatted);
  } catch (err) {
    console.error('Get role by ID error:', err);
    res.status(500).json({ error: 'Failed to fetch role' });
  }
};


// ✅ Update role
// export const updateRole = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const { name, label } = req.body;

//     const role = await prisma.role.update({
//       where: { id },
//       data: { name, label },
//     });

//     res.json(role);
//   } catch (err) {
//     console.error('Update role error:', err);
//     res.status(500).json({ error: 'Failed to update role' });
//   }
// };

// ✅ Delete role
export const deleteRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.role.delete({ where: { id } });

    res.json({ message: 'Role deleted successfully' });
  } catch (err) {
    console.error('Delete role error:', err);
    res.status(500).json({ error: 'Failed to delete role' });
  }
};


export const createRole = async (req: Request, res: Response) => {
  try {
    const { name, label, permissionIds } = req.body;

    const newRole = await prisma.role.create({
      data: {
        name,
        label,
        rolePermissions: {
          create: (permissionIds || []).map((pid: string) => ({
            permissionId: pid,
          })),
        },
      },
    });

    res.status(201).json(newRole);
  } catch (err) {
    console.error('Create role error:', err);
    res.status(500).json({ error: 'Failed to create role' });
  }
};

export const updateRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, label, permissionIds } = req.body;

    const updatedRole = await prisma.role.update({
      where: { id },
      data: {
        name,
        label,
        rolePermissions: {
          deleteMany: {}, // Clear old permissions
          create: (permissionIds || []).map((pid: string) => ({
            permissionId: pid,
          })),
        },
      },
    });

    res.json(updatedRole);
  } catch (err) {
    console.error('Update role error:', err);
    res.status(500).json({ error: 'Failed to update role' });
  }
};
