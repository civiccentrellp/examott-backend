import express from 'express';
import type { Request, RequestHandler, Response } from 'express';
// import prisma from '../../prisma/prismaClient.js'
import prisma from '../../utils/prisma.js';
import { QuestionType } from '@prisma/client';
import type { AuthedRequest } from '../../types/AuthedRequest.ts'
import { generateQuestionSnapshot } from '../../utils/snapshot/generateQuestionSnapshot.ts';

// Get all questions for a specific subtopic OR all if none
export const getAllQuestions = async (req: Request, res: Response) => {
  try {
    const { subTopicIds, type } = req.query;

    let subTopicIdsArray: string[] = [];
    if (subTopicIds) {
      subTopicIdsArray = Array.isArray(subTopicIds)
        ? subTopicIds.map(id => String(id).trim())
        : String(subTopicIds).split(',').map(id => id.trim());
    }

    const questions = await prisma.question.findMany({
      where: {
        parentId: null,
        ...(subTopicIdsArray.length > 0 ? { subTopicId: { in: subTopicIdsArray } } : {}),
        ...(type ? { type: type as QuestionType } : {})
      },
      include: {
        options: true,
        tags: true,
        attachments: true,
        children: {
          include: {
            options: true,
            tags: true,
            attachments: true,
          }
        },
        createdBy: { select: { id: true, name: true } }
      },
    });

    res.json(questions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
};

export const createQuestion: RequestHandler = async (req, res) => {
  try {
    // narrow req locally so TS knows about user
    const { user } = req as AuthedRequest;
    const {
      question,
      type,
      correctType,
      subTopicId,
      options,
      explanation,
      tags,
      attachments,
      parentId,
      paragraph,
      sectionId,
    } = req.body;

    const createdById = req.user?.id;
    if (!createdById) {
      return res.status(401).json({ error: "Unauthorized. Missing user context." });
    }

    const newQuestion = await prisma.question.create({
      data: {
        question,
        type,
        correctType,
        explanation,
        subTopicId: parentId ? undefined : (subTopicId?.trim() || undefined),
        createdById,
        parentId: parentId?.trim() || undefined,
        paragraph: paragraph || undefined,
        options: options?.length ? { create: options } : undefined,
        tags: {
          connect: (tags ?? []).filter(tag => tag.id).map(tag => ({ id: tag.id })),
          connectOrCreate: (tags ?? [])
            .filter(tag => !tag.id)
            .map(tag => ({
              where: { name: tag.name },
              create: { name: tag.name },
            })),
        },
        attachments: attachments?.length ? { create: attachments } : undefined,
      },
      include: {
        options: true,
        tags: true,
        attachments: true,
        createdBy: { select: { id: true, name: true } },
      },
    });
    res.status(201).json(newQuestion);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create question" });
  }
};


// Update an existing question
export const updateQuestion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      question,
      type,
      correctType,
      explanation,
      options,
      tags,
      attachments,
      parentId,
      paragraph,
    } = req.body;

    // ✅ Filter valid tags (must have a name)
    const validTags = (tags ?? []).filter(
      (tag: { id?: string; name?: string }) => tag?.name?.trim()
    );

    // ✅ Delete old options and attachments first
    await prisma.option.deleteMany({ where: { questionId: id } });
    await prisma.attachment.deleteMany({ where: { questionId: id } });

    const updatedQuestion = await prisma.question.update({
      where: { id },
      data: {
        question,
        paragraph,
        parentId: parentId?.trim() || undefined,

        type,
        correctType,
        explanation,

        options: options?.length
          ? {
            create: options,
          }
          : undefined,

        tags: validTags.length
          ? {
            set: validTags
              .filter((tag) => tag.id)
              .map((tag) => ({ id: tag.id })),
            connectOrCreate: validTags
              .filter((tag) => !tag.id)
              .map((tag) => ({
                where: { name: tag.name },
                create: { name: tag.name },
              })),
          }
          : undefined, // ← Do not unset if nothing is sent

        attachments: attachments?.length
          ? {
            create: attachments,
          }
          : undefined,
      },
      include: {
        options: true,
        tags: true,
        attachments: true,
        createdBy: { select: { id: true, name: true } },
      },
    });
    res.json(updatedQuestion);
  } catch (err) {
    console.error('❌ Failed to update question:', err);
    res.status(500).json({
      error: 'Failed to update question',
      details: (err as Error).message,
    });
  }
};


export const deleteQuestion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.question.update({
      where: { id },
      data: { tags: { set: [] } },
    });

    await prisma.option.deleteMany({ where: { questionId: id } });
    await prisma.attachment.deleteMany({ where: { questionId: id } });
    await prisma.questionPool.deleteMany({ where: { questionId: id } });

    const deletedQuestion = await prisma.question.delete({ where: { id } });

    res.json({ message: 'Question deleted successfully', deletedQuestion });
  } catch (err) {
    console.error('Error deleting question:', err);
    res.status(500).json({ error: 'Failed to delete question', details: err.message });
  }
};

export const getQuestionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        subTopic: {
          include: {
            topic: {
              include: {
                chapter: {
                  include: {
                    subject: {
                      include: {
                        courseSubjects: {
                          include: {
                            course: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        tags: true,
        options: true,
        attachments: true,
        createdBy: { select: { id: true, name: true } },
      },
    });


    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json(question);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch question by ID' });
  }
};
