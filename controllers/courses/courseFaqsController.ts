import express from 'express';
import type { Request, Response } from 'express';
// import prisma from "../../prisma/prismaClient.js";
import prisma from '../../utils/prisma.js';

// GET: Fetch all FAQs for a course
export const getCourseFaqs = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    console.log("➡️ [GET] /:courseId/faqs");
    const faqs = await prisma.faq.findMany({
      where: { courseId },
      orderBy: { createdAt: "desc" },
    });
    res.json(faqs);
  } catch (error) {
    console.error("❌ Failed to fetch FAQs:", error);
    res.status(500).json({ error: "Failed to fetch FAQs" });
  }
};

// POST: Create new FAQ
export const createFaq = async (req: Request, res: Response) => {
  try {
    const { courseId, question, answer } = req.body;
    console.log("➡️ [POST] /faqs ->", { courseId, question });
    const faq = await prisma.faq.create({
      data: { courseId, question, answer },
    });
    res.status(201).json(faq);
  } catch (error) {
    console.error("❌ Failed to create FAQ:", error);
    res.status(500).json({ error: "Failed to create FAQ" });
  }
};

// PUT: Update an existing FAQ
export const updateFaq = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { question, answer } = req.body;
    console.log("➡️ [PUT] /faqs/:id ->", { id, question });
    const updated = await prisma.faq.update({
      where: { id },
      data: { question, answer },
    });
    res.json(updated);
  } catch (error) {
    console.error("❌ Failed to update FAQ:", error);
    res.status(500).json({ error: "Failed to update FAQ" });
  }
};

// DELETE: Remove a FAQ
export const deleteFaq = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log("➡️ [DELETE] /faqs/:id ->", id);
    await prisma.faq.delete({
      where: { id },
    });
    res.json({ success: true });
  } catch (error) {
    console.error("❌ Failed to delete FAQ:", error);
    res.status(500).json({ error: "Failed to delete FAQ" });
  }
};
