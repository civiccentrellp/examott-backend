import { Prisma } from '@prisma/client';
import prisma from '../../utils/prisma.js';
import express from 'express';
import type { Request, Response } from 'express';
import { generateQuestionSnapshot } from '../../utils/snapshot/generateQuestionSnapshot.ts';

export const createTest = async (req: Request, res: Response) => {
  try {
    const { name, durationHr, durationMin, courseId, tags, type, allowNegative, isMultiSection, sections, instructions } = req.body;
    const totalDurationMin = durationHr * 60 + durationMin;

    const test = await prisma.test.create({
      data: {
        name,
        durationMin: totalDurationMin,
        ...(courseId && { courseId }),
        type,
        allowNegative,
        isMultiSection,
        instructions,
        tags: {
          connectOrCreate: tags.map((tag: string) => ({
            where: { name: tag },
            create: { name: tag },
          })),
        },
        sections: {
          create: sections.map((s: any) => ({
            name: s.name,
            marksPerQn: s.marksPerQn,
            negativeMarks: s.negativeMarks ?? null,
          })),
        },
      },
      include: {
        tags: true,
        sections: true,
      },
    });

    res.status(201).json(test);
  } catch (error) {
    console.error('Failed to create test:', error);
    res.status(500).json({ error: 'Failed to create test' });
  }
};

export const getAllTests = async (_req: Request, res: Response) => {
  try {
    const tests = await prisma.test.findMany({
      include: {
        tags: true,
        sections: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(tests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tests' });
  }
};


export const getTestById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const test = await prisma.test.findUnique({
      where: { id },
      include: {
        tags: true,
        sections: {
          include: {
            questions: {
              include: {
                question: {
                  include: {
                    options: true,
                    tags: true,
                    attachments: true,
                    children: {
                      include: {
                        options: true,
                        tags: true,
                        attachments: true,
                      },
                    },
                    createdBy: { select: { id: true, name: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!test) return res.status(404).json({ error: 'Test not found' });

    const testWithFlattenedQuestions = {
      ...test,
      sections: test.sections.map((section) => {
        const flatQuestions: any[] = [];

        section.questions.forEach((q) => {
          const question = q.question;

          const effectiveMarks = q.marks ?? section.marksPerQn;
          const effectiveNegative = q.negativeMarks ?? section.negativeMarks ?? 0;

          if (question?.type === 'COMPREHENSIVE' && Array.isArray(question.children)) {
            // Parent question with paragraph
            flatQuestions.push({
              ...question,
              testQuestionId: q.id,
              marks: effectiveMarks,
              negativeMarks: effectiveNegative,
              isParent: true,
            });

            // Children – inherit marks from parent TestQuestion
            question.children.forEach((child) => {
              flatQuestions.push({
                ...child,
                parentId: question.id,
                parentParagraph: question.paragraph,
                sectionQuestionId: q.id,
                marks: effectiveMarks,
                negativeMarks: effectiveNegative,
                isChild: true,
              });
            });
          } else {
            // Normal question
            flatQuestions.push({
              ...question,
              testQuestionId: q.id,
              marks: effectiveMarks,
              negativeMarks: effectiveNegative,
            });
          }
        });

        return {
          ...section,
          questions: flatQuestions,
        };
      }),
    };
    res.json(testWithFlattenedQuestions);
  } catch (err) {
    console.error('❌ Failed to fetch test details:', err);
    res.status(500).json({ error: 'Failed to fetch test details' });
  }
};


export const deleteTest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.test.delete({ where: { id } });
    res.json({ message: 'Test deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete test' });
  }
};

export const updateTest = async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log('[UPDATE TEST] Incoming payload:', req.body);

  const {
    name,
    instructions,
    tags,
    durationMin,
    courseId,
    type,
    allowNegative,
    isMultiSection,
  } = req.body;

  try {
    const updatedTest = await prisma.test.update({
      where: { id },
      data: {
        name,
        instructions,
        ...(courseId ? { courseId } : { courseId: null }),
        type,
        allowNegative,
        isMultiSection,
        durationMin: typeof durationMin === 'number' ? durationMin : parseInt(durationMin) || undefined,
        tags: {
          set: [], // Clear existing
          connectOrCreate: tags.map((tag: string) => ({
            where: { name: tag },
            create: { name: tag },
          })),
        },
      },
      include: {
        tags: true,
      },
    });

    res.json(updatedTest);
  } catch (error) {
    console.error('Error updating test:', error);
    res.status(500).json({ error: 'Failed to update test' });
  }
};

export const addSectionToTest = async (req: Request, res: Response) => {
  try {
    const { testId } = req.params;
    const { name, marksPerQn, negativeMarks } = req.body;

    const section = await prisma.testSection.create({
      data: {
        name,
        marksPerQn,
        negativeMarks,
        test: { connect: { id: testId } },
      },
    });

    res.status(201).json(section);
  } catch (error) {
    console.error('Error adding section to test:', error);
    res.status(500).json({ error: 'Failed to add section to test' });
  }
};

export const updateSection = async (req: Request, res: Response) => {
  const { sectionId } = req.params;
  const { name, marksPerQn, negativeMarks } = req.body;

  try {
    const updated = await prisma.testSection.update({
      where: { id: sectionId },
      data: {
        name,
        marksPerQn,
        negativeMarks,
      },
    });
    res.json(updated);
  } catch (error) {
    console.error('Failed to update section:', error);
    res.status(500).json({ error: 'Failed to update section' });
  }
};

export const deleteSection = async (req: Request, res: Response) => {
  const { sectionId } = req.params;

  try {
    await prisma.testSection.delete({
      where: { id: sectionId },
    });
    res.json({ message: 'Section deleted' });
  } catch (error) {
    console.error('Failed to delete section:', error);
    res.status(500).json({ error: 'Failed to delete section' });
  }
};

export const deleteQuestionFromSection = async (req: Request, res: Response) => {
  const { sectionId, questionId } = req.params;

  try {
    const deleted = await prisma.testQuestion.deleteMany({
      where: {
        sectionId,
        questionId,
      },
    });

    if (deleted.count === 0) {
      return res.status(404).json({ error: 'TestQuestion not found' });
    }

    res.json({ message: 'Question removed from section' });
  } catch (err) {
    console.error('Error deleting question from section:', err);
    res.status(500).json({ error: 'Failed to delete question from section' });
  }
};
export const deleteTestQuestionById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.testQuestion.delete({
      where: { id },
    });

    res.json({ message: 'Test question deleted' });
  } catch (err) {
    console.error('Delete failed:', err);
    res.status(500).json({ error: 'Delete failed' });
  }
};

export const updateTestQuestionMarks = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { marks, negativeMarks } = req.body;

    // ✅ Fetch test to check allowNegative
    const testQuestion = await prisma.testQuestion.findUnique({
      where: { id },
      include: {
        section: {
          include: {
            test: true,
          },
        },
      },
    });

    if (!testQuestion) return res.status(404).json({ error: 'TestQuestion not found' });

    const allowNegative = testQuestion.section.test.allowNegative;

    if (!allowNegative && negativeMarks > 0) {
      return res.status(400).json({ error: 'This test does not allow negative marks' });
    }

    const updated = await prisma.testQuestion.update({
      where: { id },
      data: {
        marks: marks ?? null,
        negativeMarks: allowNegative ? (negativeMarks ?? null) : 0,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('❌ Failed to update marks:', error);
    res.status(500).json({ error: 'Failed to update marks' });
  }
};

export const addQuestionsToSection = async (req: Request, res: Response) => {
  try {
    const { sectionId } = req.params;
    const { questionIds, marks, negativeMarks } = req.body;

    const parentQuestions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
      include: {
        options: true,
        attachments: true,
        children: {
          include: {
            options: true,
            attachments: true,
          },
        },
      },
    });

    const allToAdd: Prisma.TestQuestionCreateManyInput[] = [];

    for (const parent of parentQuestions) {
      const snapshot = generateQuestionSnapshot({
        id: parent.id,
        question: parent.question,
        explanation: parent.explanation,
        type: parent.type,
        correctType: parent.correctType,
        paragraph: parent.paragraph,
        options: parent.options,
        attachments: parent.attachments,
        children: parent.children?.map((child) => ({
          id: child.id,
          question: child.question,
          explanation: child.explanation,
          type: child.type,
          correctType: child.correctType,
          options: child.options,
          attachments: child.attachments,
        })) ?? [],
      });

      allToAdd.push({
        questionId: parent.id,
        sectionId,
        marks: marks ?? null,
        negativeMarks: negativeMarks ?? null,
        questionSnapshot: snapshot,
      });
    }

    await prisma.testQuestion.createMany({
      data: allToAdd,
      skipDuplicates: true,
    });

    res.json({ message: 'Questions added with embedded children in snapshot' });
  } catch (err) {
    console.error('❌ Failed to add questions to section:', err);
    res.status(500).json({ error: 'Failed to add questions to section' });
  }
};

export const getTestsByTag = async (req: Request, res: Response) => {
  const { tag } = req.query;

  if (!tag || typeof tag !== 'string') {
    return res.status(400).json({ error: 'Tag is required' });
  }

  try {
    const tests = await prisma.test.findMany({
      where: {
        tags: {
          some: {
            name: {
              equals: tag,
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        durationMin: true,
        type: true,
        course: {
          select: {
            id: true,
            name: true,
          },
        },
        tags: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10, // Limit results to most recent 10
    });

    res.json(tests);
  } catch (err) {
    console.error('❌ Failed to fetch tests by tag:', err);
    res.status(500).json({ error: 'Failed to fetch tests by tag' });
  }
};

// GET /api/tests/by-tags?tags=appsc,tgpsc,cpt
// export const getTestsByTags = async (req: Request, res: Response) => {
//   const { tags } = req.query;

//   if (!tags || typeof tags !== 'string') {
//     return res.status(400).json({ error: 'tags query param is required' });
//   }

//   const tagList = tags.split(',').map(tag => tag.trim());

//   try {
//     const tests = await prisma.test.findMany({
//       where: {
//         tags: {
//           some: {
//             name: {
//               in: tagList,
//             },
//           },
//         },
//       },
//       select: {
//         id: true,
//         name: true,
//         durationMin: true,
//         type: true,
//         createdAt: true,
//         tags: true,
//         course: {
//           select: {
//             id: true,
//             name: true,
//           },
//         },
//       },
//       orderBy: {
//         createdAt: 'desc',
//       },
//       take: 12,
//     });

//     res.json(tests);
//   } catch (err) {
//     console.error('❌ Failed to fetch tests by tags:', err);
//     res.status(500).json({ error: 'Failed to fetch tests by tags' });
//   }
// };

export const getTestsByTags = async (req: Request, res: Response) => {
  
  let tags: string[] = [];

  if (typeof req.query.tags === 'string') {
    tags = req.query.tags.split(','); // ✅ from ?tags=appsc,tgpsc
  } else if (Array.isArray(req.query.tags)) {
    tags = req.query.tags as string[];
  }

  if (tags.length === 0) {
    return res.status(400).json({ error: 'Tags are required' });
  }
  console.log('🔍 Querying tests with tags:', tags);

  try {
    const tests = await prisma.test.findMany({
      where: {
        tags: {
          some: {
            name: {
              in: tags,
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        durationMin: true,
        type: true,
        course: {
          select: {
            id: true,
            name: true,
          },
        },
        tags: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    res.json(tests);
  } catch (err) {
    console.error('❌ Failed to fetch tests by tags:', err);
    res.status(500).json({ error: 'Failed to fetch tests by tags' });
  }
};
