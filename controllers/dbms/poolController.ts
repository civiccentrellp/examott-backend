import express from 'express';
import type { Request, Response } from 'express';
// import prisma from '../../prisma/prismaClient.js';
import prisma from '../../utils/prisma.js';

// Create new pool
export const addPool = async (req: Request, res: Response) => {
  const { name } = req.body;
  try {
    const pool = await prisma.pool.create({
      data: { name }
    });
    res.status(201).json(pool);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create pool' });
  }
};

// Add question to pool
export const addQuestionToPool = async (req: Request, res: Response) => {
  const { poolId } = req.params;
  const { questionId } = req.body;
  try {
    const entry = await prisma.questionPool.create({
      data: {
        poolId,
        questionId
      }
    });
    res.status(201).json(entry);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add question to pool' });
  }
};

// Get all pools with full question details
export const getPools = async (_req: Request, res: Response) => {
  try {
    const pools = await prisma.pool.findMany({
      include: {
        questions: {
          include: {
            question: {
              include: {
                options: true,
                tags: true,
                attachments: true,
              },
            },
          },
        },
      },
    });

    const formattedPools = pools.map(pool => ({
      id: pool.id,
      name: pool.name,
      createdAt: pool.createdAt,
      // questions: pool.questions.map(qp => qp.question), // ✅ flattening question objects
      questions: pool.questions.map(qp => ({
        id: qp.question.id,
        question: qp.question.question,
        questionId: qp.questionId,      // <- This is required for accurate deletion
        poolId: qp.poolId, 
        explanation: qp.question.explanation,
        type: qp.question.type,
        correctType: qp.question.correctType,
        options: qp.question.options,
        tags: qp.question.tags,
        attachments: qp.question.attachments,
        createdById: qp.question.createdById,
        subTopicId: qp.question.subTopicId,
        createdAt: qp.question.createdAt,
        updatedAt: qp.question.updatedAt
      }))
      
    }));

    res.json(formattedPools);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch pools' });
  }
};


// Delete a pool
export const deletePool = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.pool.delete({
      where: { id }
    });
    res.json({ message: 'Pool deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete pool' });
  }
};

// export const removeQuestionFromPool = async (req: Request, res: Response) => {
//   const { poolId, questionId } = req.params

//   try {
//     await prisma.questionPool.delete({
//       where: {
//         poolId_questionId: {
//           poolId,
//           questionId
//         }
//       }
//     })
//     res.status(200).json({ message: 'Question removed from pool' })
//   } catch (error) {
//     console.error(error)
//     res.status(500).json({ message: 'Failed to remove question from pool' })
//   }
// }
// DELETE /api/pools/:poolId/questions/:questionId
export const removeQuestionFromPool = async (req: Request, res: Response) => {
  const { poolId, questionId } = req.params;

  try {
    const deleted = await prisma.questionPool.deleteMany({
      where: {
        poolId,
        questionId,
      },
    });

    if (deleted.count === 0) {
      return res.status(404).json({ error: 'Question not found in pool' });
    }

    res.json({ message: 'Question removed from pool successfully' });
  } catch (err) {
    console.error('Failed to remove question from pool:', err);
    res.status(500).json({ error: 'Failed to remove question from pool' });
  }
};
