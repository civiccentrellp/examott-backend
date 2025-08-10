import express from 'express';
import type { Request, Response } from 'express';
// import prisma from "../../prisma/prismaClient.js";
import prisma from '../../utils/prisma.js';

export const getAllSubTopics = async (req: Request, res: Response) => {
  try {
    const { topicId } = req.query

    const subTopics = await prisma.subTopic.findMany({
      where: topicId ? { topicId: String(topicId) } : {},
    })

    res.json(subTopics)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch subtopics' })
  }
}

export const createSubTopic = async (req: Request, res: Response) => {
  try {
    const { name, topicId } = req.body

    const subTopic = await prisma.subTopic.create({
      data: { name, topicId },
    })

    res.status(201).json(subTopic)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create subtopic' })
  }
}
