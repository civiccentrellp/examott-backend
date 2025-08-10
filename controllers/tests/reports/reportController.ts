import { io } from '../../../index.js';

/// <reference path="../../types/express/index.d.ts" />
import express from 'express';
import type { Request, Response } from 'express';
import prisma from '../../../utils/prisma.js';

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

export const getReportsByUser = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });

        const reports = await prisma.questionReport.findMany({
            where: {
                reportedBy: req.user.id,
                status: "OPEN", // <-- Added filter
            },
            include: {
                question: { include: { options: true } },
                childQuestion: { include: { options: true } },
                reportedByUser: { select: { id: true, name: true, email: true } },
                section: true,
                attempt: {
                    include: { test: { select: { name: true, id: true } } },
                },
                resolvedByUser: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        res.json(reports);
    } catch (error) {
        console.error("Error fetching reports by user:", error);
        res.status(500).json({ error: "Failed to fetch reports by user" });
    }
};

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

export const getResolvedReportsByUser = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });

        const reports = await prisma.questionReport.findMany({
            where: {
                reportedBy: req.user.id,
                status: { in: ["RESOLVED", "DISMISSED"] },
            },
            include: {
                question: { include: { options: true } },
                childQuestion: { include: { options: true } },
                reportedByUser: { select: { id: true, name: true, email: true } },
                section: true,
                attempt: {
                    include: { test: { select: { id: true, name: true } } },
                },
                resolvedByUser: { select: { id: true, name: true, email: true } },
            },
            orderBy: { resolvedAt: "desc" },
        });

        res.json(reports);
    } catch (error) {
        console.error("Error fetching resolved reports of user:", error);
        res.status(500).json({ error: "Failed to fetch resolved reports of user" });
    }
};

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