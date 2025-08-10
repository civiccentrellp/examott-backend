import express from 'express'
import { getAllSubjects, createSubject } from '../../controllers/dbms/subjectController.ts'
const router = express.Router()

router.get('/', getAllSubjects)
router.post('/', createSubject)

export default router
