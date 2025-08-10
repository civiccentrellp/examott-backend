import express from 'express'
import { getAllChapters, createChapter } from '../../controllers/dbms/chapterController.ts'

const router = express.Router()

router.get('/', getAllChapters)
router.post('/', createChapter)

export default router
