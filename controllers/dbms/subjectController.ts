// import prisma from "../../prisma/prismaClient.js"
import prisma from '../../utils/prisma.js';
import express from 'express';
import type { Request, Response } from 'express';

interface CreateSubjectRequestBody {
  name: string;
  courseId: string;
}

export const getAllSubjects = async (req: Request, res: Response) => {
  try {
    const subjects = await prisma.subject.findMany({
      include: {
        chapters: true,
      },
    });

    res.json({ success: true, data: subjects });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error fetching subjects" });
  }
};

export const createSubject = async (req: Request, res: Response) => {
  try {
    const { name, courseId }: CreateSubjectRequestBody = req.body;

    const subject = await prisma.subject.create({
      data: {
        name,
        courseSubjects: {
          create: [
            {
              courseId, // Linking the subject to the course through the CourseSubject join table
            },
          ],
        },
      },
    });

    res.status(201).json(subject);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create subject', details: err.message });
  }
};