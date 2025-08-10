import express from 'express';
import type { Request, Response } from 'express';
// import prisma from '../../prisma/prismaClient.js';
import prisma from '../../utils/prisma.js';
import { AttachmentType } from '@prisma/client'; // ✅ Import the enum from Prisma

export const addAttachments = async (req: Request, res: Response) => {
  const { questionId } = req.params;
  const attachments: { type: string; url: string }[] = req.body;

  if (!questionId || !Array.isArray(attachments)) {
    return res.status(400).json({ message: 'Invalid input' });
  }

  try {
    const createdAttachments = await Promise.all(
      attachments.map((att) =>
        prisma.attachment.create({
          data: {
            questionId,
            type: att.type as AttachmentType, // ✅ Cast to enum
            url: att.url,
          },
        })
      )
    );
    res.status(201).json(createdAttachments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to save attachments' });
  }
};
