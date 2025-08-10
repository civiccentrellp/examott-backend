import express from 'express'
import { getAllSubTopics, createSubTopic } from '../../controllers/dbms/subTopicController.ts'

const router = express.Router()

router.get('/', getAllSubTopics)
router.post('/', createSubTopic)

export default router
