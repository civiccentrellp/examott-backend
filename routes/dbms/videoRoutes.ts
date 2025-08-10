import express from 'express'
import { getVideosByFolder, createVideo, updateVideo, deleteVideo } from '../../controllers/dbms/videoController.ts'

const router = express.Router()

// GET /api/video/folder/:folderId
router.get('/folder/:folderId', getVideosByFolder)

// Route for creating a new video
router.post('/', createVideo)

// Route for updating an existing video
router.put('/:id', updateVideo)

// Route for deleting a video
router.delete('/:id', deleteVideo)

export default router
