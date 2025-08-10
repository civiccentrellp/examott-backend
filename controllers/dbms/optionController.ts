import express from 'express';
import type { Request, Response } from 'express';
// import prisma from '../../prisma/prismaClient.js';
import prisma from '../../utils/prisma.js';

export const addOptions = async (req: Request, res: Response) => {
  try {
    const { questionId } = req.params;
    const options = req.body; // ✅ directly use body as array

    if (!options || !Array.isArray(options)) {
      return res.status(400).json({ error: 'Invalid options array' });
    }

    const createdOptions = await Promise.all(
      options.map(option =>
        prisma.option.create({
          data: {
            value: option.value,
            correct: option.correct,
            questionId,
            
          },
        })
      )
    );

    res.status(201).json(createdOptions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add options' });
  }
};
