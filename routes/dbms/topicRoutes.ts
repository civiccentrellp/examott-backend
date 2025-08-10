import express from 'express'
import { getAllTopics , createTopic } from '../../controllers/dbms/topicController.ts'

const router = express.Router()

router.get('/', getAllTopics)
router.post('/', createTopic)

export default router
