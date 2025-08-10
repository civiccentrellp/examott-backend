import express from 'express';
import type { Request, Response } from 'express';
// import prisma from "../../prisma/prismaClient.js";
import prisma from '../../utils/prisma.js';

export const getAllTopics = async (req: Request, res: Response) => {
  try {
    const { chapterId } = req.query
    const topics = await prisma.topic.findMany({
      where: chapterId ? { chapterId: String(chapterId) } : {},
    })

    res.json(topics)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch topics' })
  }
}

export const createTopic = async (req: Request, res: Response) => {
  try {
    const { name, chapterId } = req.body

    const topic = await prisma.topic.create({
      data: { name, chapterId },
    })

    res.status(201).json(topic)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create topic' })
  }
}
