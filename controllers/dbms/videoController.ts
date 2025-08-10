import express from 'express';
import type { Request, Response } from 'express';
// import prisma from '../../prisma/prismaClient.js'
import prisma from '../../utils/prisma.js';

// GET /api/video-folder/:folderId/videos
export const getVideosByFolder = async (req: Request, res: Response) => {
  try {
    const { folderId } = req.params;

    if (!folderId) {
      return res.status(400).json({ error: "folderId is required" });
    }

    const videos = await prisma.video.findMany({
      where: { folderId },
    });

    res.json({ data: videos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch videos by folder' });
  }
};

export const createVideo = async (req: Request, res: Response) => {
  try {
    const { url, title, description, folderId } = req.body;

    if (!folderId || !url || !title) {
      return res.status(400).json({ error: "folderId, title, and url are required" });
    }

    const newVideo = await prisma.video.create({
      data: {
        url,
        title,
        description,
        folderId,
      },
    });

    res.status(201).json(newVideo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create video' });
  }
};

// Update an existing video
export const updateVideo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { url, title, description } = req.body

    const updatedVideo = await prisma.video.update({
      where: { id },
      data: {
        url,
        title,
        description,
      },
    })

    res.json(updatedVideo)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update video' })
  }
}

// Delete a video
export const deleteVideo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const deletedVideo = await prisma.video.delete({
      where: { id },
    })

    res.json({ message: 'Video deleted successfully', deletedVideo })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete video' })
  }
}
