// controllers/dbms/videoFolderController.ts
import express from 'express';
import type { Request, Response } from 'express';
// import prisma from '../../prisma/prismaClient.js'
import prisma from '../../utils/prisma.js';

// Create a video folder
export const createVideoFolder = async (req: Request, res: Response) => {
  try {
    const { name, courseId } = req.body;

    if (!name || !courseId) {
      return res.status(400).json({ error: 'Name and courseId are required' });
    }

    const folder = await prisma.videoFolder.create({
      data: { name, courseId },
    });

    res.status(201).json(folder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create video folder' });
  }
};

// Get all folders for a course
export const getVideoFolders = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.query;

    const folders = await prisma.videoFolder.findMany({
      where: courseId ? { courseId: String(courseId) } : undefined,
      include: { videos: true },
    });

    res.json({ data: folders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch video folders' });
  }
};


// Delete a video folder
export const deleteVideoFolder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.videoFolder.delete({
      where: { id },
    });

    res.json({ message: 'Folder deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete video folder' });
  }
};

// Update a video folder name
export const updateVideoFolder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const updated = await prisma.videoFolder.update({
      where: { id },
      data: { name },
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update folder' });
  }
};