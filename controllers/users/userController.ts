// import prisma from '../../prisma/prismaClient.js';
import prisma from '../../utils/prisma.js';
import express from 'express';
import type { Request, Response } from 'express';
import bcrypt from "bcryptjs";

// export const createUserFromAdmin = async (req: Request, res: Response) => {
//   try {
//     const { name, email, password, mobile, roleId } = req.body;

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const user = await prisma.user.create({
//       data: {
//         name,
//         email,
//         password: hashedPassword,
//         mobile,
//         roleId: roleId || null,
//       },
//     });

//     res.status(201).json(user);
//   } catch (err) {
//     console.error("Create user error:", err);
//     res.status(500).json({ error: "Failed to create user", details: err });
//   }
// };
export const createUserFromAdmin = async (req: Request, res: Response) => {
  try {
    const { name, email, password, mobile, roleId } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔍 Get default role (STUDENT) if no roleId is provided
    let finalRoleId = roleId;
    if (!roleId) {
      const defaultRole = await prisma.role.findFirst({
        where: { name: 'student' },
      });

      finalRoleId = defaultRole?.id ?? null;
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        mobile,
        roleId: finalRoleId,
      },
    });

    res.status(201).json(user);
  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({ error: "Failed to create user", details: err });
  }
};

export const assignUserRole = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const { roleId } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        roleId,
      },
    });

    res.json(updatedUser);
  } catch (err) {
    console.error("Assign role error:", err);
    res.status(500).json({ error: "Failed to assign role", details: err });
  }
};

export const getAllUsers = async (_: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
        userPermissions: {
          include: { permission: true },
        },
      },
    });

    res.json(users);
  } catch (err) {
    console.error("Fetch users error:", err);
    res.status(500).json({ error: "Failed to fetch users", details: err });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
        userPermissions: {
          include: { permission: true },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ error: "Failed to get user", details: err });
  }
};


export const getAllRoles = async (_: Request, res: Response) => {
  try {
    const roles = await prisma.role.findMany();
    res.json(roles);
  } catch (err) {
    console.error("Fetch roles error:", err);
    res.status(500).json({ error: "Failed to fetch roles", details: err });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const { name, mobile, profilePicture, roleId } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        mobile,
        profilePicture,
        roleId
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
        userPermissions: {
          include: { permission: true },
        },
      }

    });

    res.json(updatedUser);
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ error: "Failed to update user", details: err });
  }
};
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;

    await prisma.user.delete({
      where: { id: userId },
    });

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ error: "Failed to delete user", details: err });
  }
};
