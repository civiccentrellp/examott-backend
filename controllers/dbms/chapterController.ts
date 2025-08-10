// import prisma from '../../prisma/prismaClient.js'
import prisma from "../../utils/prisma.js";

export const getAllChapters = async (req, res) => {
  try {
    const { subjectId } = req.query
    console.log('Selected Subject ID:', subjectId);


    const chapters = await prisma.chapter.findMany({
      where: subjectId ? { subjectId: String(subjectId) } : {},
    })

    res.json({ data: chapters }) // ✅
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chapters' })
  }
}

export const createChapter = async (req, res) => {
  try {
    const { name, subjectId } = req.body

    const chapter = await prisma.chapter.create({
      data: { name, subjectId },
    })

    res.status(201).json(chapter)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create chapter' })
  }
}
