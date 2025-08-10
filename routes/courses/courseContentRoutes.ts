
// File: routes/courseContentRoutes.ts
import express from 'express';
import {
  createCourseContent,
  getCourseContents,
  updateCourseContent,
  deleteCourseContent,
  createCourseContentFolder,
  getCourseContentFolders,
  updateCourseContentFolder,
  deleteCourseContentFolder,
  proxyPdfFile,
  saveCourseContentProgress,
  getCourseContentProgress,
  getCourseProgressSummary,
  saveLastOpenedContent,
  getLastOpenedContent,
} from '../../controllers/courses/courseContentController.ts';
import { authenticate } from '../../middlewares/auth.ts';

const router = express.Router();
router.get('/proxy-pdf', proxyPdfFile);

// Content routes
router.post('/:courseId/contents', createCourseContent);
router.get('/:courseId/contents', getCourseContents);
router.put('/contents/:id', updateCourseContent);
router.delete('/contents/:id', deleteCourseContent);

// Folder routes
router.post('/:courseId/folders', createCourseContentFolder);
router.get('/:courseId/folders', getCourseContentFolders);
router.put('/folders/:id', updateCourseContentFolder);
router.delete('/folders/:id', deleteCourseContentFolder);

// Progress routes
router.post('/:courseId/progress', authenticate, saveCourseContentProgress);
router.get('/:courseId/progress', authenticate, getCourseContentProgress);
router.get('/:courseId/progress-summary', authenticate, getCourseProgressSummary);

// Last opened content routes
router.post('/:courseId/last-opened', authenticate, saveLastOpenedContent);
router.get('/:courseId/last-opened', authenticate, getLastOpenedContent);

export default router;