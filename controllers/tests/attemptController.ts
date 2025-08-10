import { io } from '../../index.js';

/// <reference path="../../types/express/index.d.ts" />
import express from 'express';
import type { Request, Response } from 'express';
import prisma from '../../utils/prisma.js';

export const startTestAttempt = async (req, res) => {
  try {
    const { testId } = req.body;
    const userId = req.user.id;

    const newAttempt = await prisma.studentTestAttempt.create({
      data: {
        testId,
        userId,
      },
    });
    io.emit("test-attempt-started", newAttempt);
    return res.status(201).json({ attemptId: newAttempt.id });
  } catch (err) {
    console.error('Error starting test:', err);
    res.status(500).json({ error: 'Failed to start test' });
  }
};

export const saveStudentAnswer = async (req, res) => {
  const {
    attemptId,
    questionId,
    sectionId,
    selectedAnswer,
    markedForReview = false,
    timeTakenSeconds = 0, // <- add this field
  } = req.body;

  let savedAnswer;

  const existing = await prisma.studentTestAnswer.findUnique({
    where: {
      attemptId_questionId: {
        attemptId,
        questionId,
      },
    },
  });

  if (existing) {
    savedAnswer = await prisma.studentTestAnswer.update({
      where: { id: existing.id },
      data: {
        selectedAnswer,
        markedForReview,
        status: selectedAnswer ? 'ANSWERED' : 'UNANSWERED',
        timeTakenSeconds, // ✅ store it
      },
    });
  } else {
    savedAnswer = await prisma.studentTestAnswer.create({
      data: {
        attemptId,
        questionId,
        sectionId,
        selectedAnswer,
        markedForReview,
        status: selectedAnswer ? 'ANSWERED' : 'UNANSWERED',
        timeTakenSeconds, // ✅ store it
      },
    });
  }
  io.emit("answer-saved", savedAnswer);
  res.status(200).json({ success: true });
};

export const getTestResultByAttemptId = async (req: Request, res: Response) => {
  const { attemptId } = req.params;

  try {
    const attempt = await prisma.studentTestAttempt.findUnique({
      where: { id: attemptId },
      include: {
        test: {
          include: {
            tags: true,         // ✅ include related tags
            course: true,       // ✅ optional: include course details
          },
        },
        user: { select: { id: true, name: true, email: true } },
        answers: {
          include: {
            question: {
              include: { options: true },
            },
            section: true,
          },
        },
        sectionStats: {
          include: { section: true },
        },
      },
    });

    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });

    res.json(attempt);
  } catch (err) {
    console.error('❌ Error fetching result:', err);
    res.status(500).json({ error: 'Failed to fetch result' });
  }
};

export const getUserResults = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = req.user.id;

  try {
    const results = await prisma.studentTestAttempt.findMany({
      where: { userId },
      include: {
        test: true,
        sectionStats: true,
      },
      orderBy: { submittedAt: 'desc' },
    });

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user results' });
  }
};

export const reportQuestion = async (req: Request, res: Response) => {

  try {
    const { attemptId, questionId, sectionId, reason } = req.body;
    const reportedBy = req.user?.id;

    if (!reportedBy || !attemptId || !questionId || !sectionId || !reason) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if it's a child question
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: { parentId: true },
    });

    const parentId = question?.parentId;

    const report = await prisma.questionReport.create({
      data: {
        attemptId,
        questionId: parentId || questionId,
        childQuestionId: parentId ? questionId : null,
        sectionId,
        reportedBy,
        reason,
      },
    });
    io.emit("reported", report);
    res.status(201).json({ success: true, report });
  } catch (err) {
    console.error('❌ Error reporting question:', err);
    res.status(500).json({ error: 'Failed to report question' });
  }
};

export const submitTestAttempt = async (req, res) => {
  try {
    const { attemptId } = req.body;

    const attempt = await prisma.studentTestAttempt.findUnique({
      where: { id: attemptId },
      include: {
        answers: true,
        test: {
          include: {
            sections: {
              include: {
                questions: {
                  include: {
                    question: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });

    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;
    let answeredCount = 0;
    let totalMarks = 0;
    let negativeMarks = 0;
    let totalTimeTaken = 0;
    let maxPossibleMarks = 0;

    for (const section of attempt.test.sections) {
      for (const testQn of section.questions) {
        let raw = testQn.questionSnapshot ?? testQn.question;
        let parsed;

        try {
          parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        } catch (e) {
          console.error('❌ Invalid snapshot JSON:', raw);
          unansweredCount++;
          continue;
        }

        const children = parsed?.type === 'COMPREHENSIVE' ? parsed.children || [] : [parsed];

        for (const q of children) {
          const answer = attempt.answers.find((ans) => ans.questionId === q.id);

          const marks = q.marks ?? testQn.marks ?? section.marksPerQn ?? 1;
          const neg = q.negativeMarks ?? testQn.negativeMarks ?? section.negativeMarks ?? 0;
          const timeTaken = answer?.timeTakenSeconds ?? 0;
          totalTimeTaken += timeTaken;
          maxPossibleMarks += marks;

          const selectedRaw = answer?.selectedAnswer;
          const isArray = Array.isArray(selectedRaw);

          const isUnanswered =
            selectedRaw == null ||
            selectedRaw === 'undefined' ||
            (typeof selectedRaw === 'string' && selectedRaw.trim() === '') ||
            (isArray && selectedRaw.length === 0);

          if (isUnanswered) {
            unansweredCount++;
            continue;
          }

          answeredCount++;

          let isCorrect = false;

          if (q.correctType === 'SINGLE') {
            const correctOption = q.options?.find((opt) => opt.correct);
            const correctVal = String(correctOption?.value).trim();
            const selected = String(selectedRaw).trim();
            isCorrect = selected === correctVal;
          }

          if (q.correctType === 'MULTIPLE') {
            const correctValues = (q.options || [])
              .filter((opt) => opt.correct)
              .map((opt) => String(opt.value).trim())
              .sort();

            const selectedValues = isArray
              ? selectedRaw.map((val) => String(val).trim()).sort()
              : [];

            isCorrect = JSON.stringify(correctValues) === JSON.stringify(selectedValues);
          }

          if (answer) {
            await prisma.studentTestAnswer.update({
              where: { id: answer.id },
              data: {
                isCorrect,
                marksScored: isCorrect ? marks : (attempt.test.allowNegative ? -neg : 0),
              },
            });
          }

          if (isCorrect) {
            correctCount++;
            totalMarks += marks;
          } else {
            wrongCount++;
            if (attempt.test.allowNegative) negativeMarks += neg;
          }
        }
      }
    }

    const finalScore = totalMarks - negativeMarks;
    const totalQuestions = correctCount + wrongCount + unansweredCount;
    const avgTimePerQn = totalQuestions > 0 ? Math.round(totalTimeTaken / totalQuestions) : 0;

    const updatedAttempt = await prisma.studentTestAttempt.update({
      where: { id: attemptId },
      data: {
        submittedAt: new Date(),
        totalTimeTaken,
        totalMarks,
        negativeMarks,
        finalScore,
        correctCount,
        wrongCount,
        unansweredCount,
        answeredCount,
        avgTimePerQn,
        maxPossibleMarks,
      },
    });
    io.emit("test-submitted", updatedAttempt);
    res.json({ message: 'Test submitted successfully', attempt: updatedAttempt });
  } catch (error) {
    console.error('❌ Failed to submit test:', error);
    res.status(500).json({ error: 'Failed to submit test' });
  }
};


// Get all reported questions
export const getAllReportedQuestions = async (req: Request, res: Response) => {
  try {
    const reports = await prisma.questionReport.findMany({
      where: { status: "OPEN" },
      include: {
        question: { include: { options: true } }, // to display options
        childQuestion: { include: { options: true } },
        reportedByUser: { select: { id: true, name: true, email: true } },
        section: true,
        attempt: {
          include: {
            test: { select: { name: true, id: true } }, // ✅ Get test name
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reported questions' });
  }
};

// Resolve report
export const resolveReportedQuestion = async (req: Request, res: Response) => {
  const { reportId } = req.params;
  const { resolutionRemarks } = req.body;

  try {
    const updated = await prisma.questionReport.update({
      where: { id: reportId },
      data: {
        status: "RESOLVED",
        resolutionRemarks,
        resolvedAt: new Date(),
        resolvedBy: req.user?.id, // assuming admin
      },
    });
    io.emit("resolved", updated);
    res.json({ success: true, report: updated });
  } catch (error) {
    console.error('Error resolving report:', error);
    res.status(500).json({ error: 'Failed to resolve report' });
  }
};

// Dismiss Report
export const dismissReportedQuestion = async (req: Request, res: Response) => {
  const { reportId } = req.params;
  try {
    const updated = await prisma.questionReport.update({
      where: { id: reportId },
      data: {
        status: "DISMISSED",
        resolutionRemarks: "Dismissed without changes",
        resolvedAt: new Date(),
        resolvedBy: req.user?.id,
      },
    });
    io.emit("dismissed", updated);
    res.json({ success: true, report: updated });
  } catch (error) {
    console.error('Error dismissing report:', error);
    res.status(500).json({ error: 'Failed to dismiss report' });
  }
};

// Get all resolved reports
export const getAllResolvedReports = async (req: Request, res: Response) => {
  try {
    const reports = await prisma.questionReport.findMany({
      where: {
        status: { in: ["RESOLVED", "DISMISSED"] },
      },
      include: {
        question: { include: { options: true } },
        childQuestion: { include: { options: true } },
        reportedByUser: { select: { id: true, name: true, email: true } },
        section: true,
        attempt: {
          include: {
            test: { select: { id: true, name: true } }, // test name
          },
        },
        resolvedByUser: { select: { id: true, name: true, email: true } },
      },
      orderBy: { resolvedAt: "desc" },
    });

    res.json(reports);
  } catch (error) {
    console.error("Error fetching resolved reports:", error);
    res.status(500).json({ error: "Failed to fetch resolved reports" });
  }
};
