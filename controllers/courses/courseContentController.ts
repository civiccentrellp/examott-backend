/// <reference path="../../types/express/index.d.ts" />

import express from 'express';
import type { Request, Response } from 'express';
// import prisma from "../../prisma/prismaClient.js";
import prisma from '../../utils/prisma.js';
import https from "https";
import fetch from 'node-fetch';


// POST /api/courses/:courseId/contents
export const createCourseContent = async (req, res) => {
  try {
    const { courseId } = req.params;
    const {
      name,
      type, // CourseContentType
      url, // Optional (for uploaded files)
      folderId,
      linkedTestId,
      linkedVideoId,
      linkedAttachmentId,
      isDownloadable = true,
    } = req.body;

    if (!courseId || !folderId || !name || !type) {
      return res.status(400).json({ error: 'Missing or invalid URL for attachment type' });
    }


    const content = await prisma.courseContent.create({
      data: {
        name,
        type,
        url,
        courseId,
        folderId,
        linkedTestId,
        linkedVideoId,
        linkedAttachmentId,
        isDownloadable,
      },
    });

    res.status(201).json({ success: true, data: content });
  } catch (err) {
    console.error('Failed to create course content:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// GET /api/courses/:courseId/contents
export const getCourseContents = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const contents = await prisma.courseContent.findMany({
      where: { courseId },
      include: {
        folder: true,
        linkedTest: true,
        linkedVideo: true,
        linkedAttachment: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, data: contents });
  } catch (err) {
    console.error('Failed to fetch course contents:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// PUT /api/contents/:id
export const updateCourseContent = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const updated = await prisma.courseContent.update({
      where: { id },
      data,
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Failed to update course content:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// DELETE /api/contents/:id
export const deleteCourseContent = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.courseContent.delete({ where: { id } });
    res.json({ success: true, message: 'Content deleted' });
  } catch (err) {
    console.error('Failed to delete course content:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// POST /api/courses/:courseId/folders
export const createCourseContentFolder = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { name, parentId } = req.body;

    if (!courseId || !name) {
      return res.status(400).json({ error: 'Course ID and folder name are required' });
    }

    const folder = await prisma.courseContentFolder.create({
      data: {
        name,
        courseId,
        parentId: parentId || null,
      },
    });

    res.status(201).json({ success: true, data: folder });
  } catch (err) {
    console.error('Failed to create course folder:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// GET /api/courses/:courseId/folders
export const getCourseContentFolders = async (req, res) => {
  try {
    const { courseId } = req.params;
    const folders = await prisma.courseContentFolder.findMany({
      where: { courseId },
      include: {
        contents: true,
        children: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, data: folders });
  } catch (err) {
    console.error('Failed to fetch folders:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// PUT /api/folders/:id
export const updateCourseContentFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, parentId } = req.body;
    const updated = await prisma.courseContentFolder.update({
      where: { id },
      data: {
        name,
        parentId: parentId || null,
      },
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Failed to update folder:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// DELETE /api/folders/:id
export const deleteCourseContentFolder = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.courseContentFolder.delete({ where: { id } });
    res.json({ success: true, message: 'Folder deleted' });
  } catch (err) {
    console.error('Failed to delete folder:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};


// GET /api/courses/proxy-pdf?url=...
export const proxyPdfFile = async (req, res) => {
  try {
    const { url } = req.query;

    if (!url || typeof url !== "string" || !/^https:\/\/firebasestorage\.googleapis\.com/.test(url)) {
      return res.status(400).json({ error: "Missing or invalid Firebase Storage URL" });
    }

    const response = await fetch(url);
    if (!response.ok) {
      console.error(`❌ Firebase responded with: ${response.status}`);
      return res.status(404).json({ error: "PDF not found" });
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "application/pdf";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "no-cache");
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("PDF Proxy Error:", err);
    res.status(500).json({ error: "Failed to proxy PDF" });
  }
};

// POST /api/courses/:courseId/progress
export const saveCourseContentProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { contentId, isCompleted } = req.body;
    const userId = req.user.id; // ensure auth middleware sets req.user
    console.log("saveCourseContentProgress body:", req.body);

    if (!contentId) return res.status(400).json({ error: 'contentId required' });

    const progress = await prisma.courseContentProgress.upsert({
      where: { userId_contentId: { userId, contentId } },
      update: { isCompleted },
      create: { userId, courseId, contentId, isCompleted },
    });

    res.json({ success: true, data: progress });
  } catch (err) {
    console.error('Failed to save course content progress:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// GET /api/courses/:courseId/progress
export const getCourseContentProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const progress = await prisma.courseContentProgress.findMany({
      where: { userId, courseId },
    });

    res.json({ success: true, data: progress });
  } catch (err) {
    console.error('Failed to fetch course content progress:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// GET /api/courses/:courseId/progress-summary
export const getCourseProgressSummary = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const [totalContents, completedContents] = await Promise.all([
      prisma.courseContent.count({ where: { courseId } }),
      prisma.courseContentProgress.count({ where: { userId, courseId, isCompleted: true } }),
    ]);

    const percentage = totalContents > 0 ? Math.round((completedContents / totalContents) * 100) : 0;

    res.json({
      success: true,
      data: {
        totalContents,
        completedContents,
        percentage,
      },
    });
  } catch (err) {
    console.error('Failed to fetch course progress summary:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// POST /api/courses/:courseId/last-opened
export const saveLastOpenedContent = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { contentId, folderId } = req.body;
    const userId = req.user.id;  // requires auth middleware
    console.log("saveLastOpenedContent body:", req.body);

    if (!contentId) return res.status(400).json({ error: 'contentId required' });

    const record = await prisma.userCourseLastContent.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: { contentId, folderId },
      create: { userId, courseId, contentId, folderId },
    });

    res.json({ success: true, data: record });
  } catch (err) {
    console.error('Failed to save last opened content:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// GET /api/courses/:courseId/last-opened
export const getLastOpenedContent = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const record = await prisma.userCourseLastContent.findUnique({
      where: { userId_courseId: { userId, courseId } },
      include: { content: true },
    });

    res.json({ success: true, data: record });
  } catch (err) {
    console.error('Failed to fetch last opened content:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

