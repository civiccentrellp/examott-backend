import express from 'express';
import type { Request, Response } from 'express';
// import prisma from "../../prisma/prismaClient.js";
import prisma from '../../utils/prisma.js';

export const createPermission = async (req: Request, res: Response) => {
  try {
    const { name, label } = req.body;
    const permission = await prisma.permission.create({ data: { name, label } });
    res.status(201).json(permission);
  } catch (err) {
    console.error('Create permission error:', err);
    res.status(500).json({ error: 'Failed to create permission' });
  }
};

export const getAllPermissions = async (_: Request, res: Response) => {
  try {
    const permissions = await prisma.permission.findMany();
    res.json(permissions);
  } catch (err) {
    console.error('Get permissions error:', err);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
};

export const updatePermission = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, label } = req.body;

    const updated = await prisma.permission.update({
      where: { id },
      data: { name, label },
    });

    res.json(updated);
  } catch (err) {
    console.error('Update permission error:', err);
    res.status(500).json({ error: 'Failed to update permission' });
  }
};

export const deletePermission = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.permission.delete({ where: { id } });
    res.json({ message: 'Permission deleted' });
  } catch (err) {
    console.error('Delete permission error:', err);
    res.status(500).json({ error: 'Failed to delete permission' });
  }
};
