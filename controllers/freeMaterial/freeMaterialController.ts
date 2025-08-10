import express from 'express';
import type { Request, Response } from 'express';
// import prisma from '../../prisma/prismaClient.js'
import prisma from '../../utils/prisma.js';
import { FreeMaterialType } from '@prisma/client';


export const createFreeMaterial = async (req: Request, res: Response) => {
  try {
    const { title, description, type, videoId, documentUrl, testId } = req.body;

    const data: any = { title, description, type };
    if (type === 'VIDEO') data.videoId = videoId;
    if (type === 'DOCUMENT') data.documentUrl = documentUrl;
    if (type === 'TEST') data.testId = testId;

    const freeMaterial = await prisma.freeMaterial.create({ data });
    return res.status(201).json(freeMaterial);
  } catch (error) {
    console.error('Error creating FreeMaterial:', error);
    return res.status(500).json({ error: 'Failed to create free material' });
  }
};

export const getAllFreeMaterials = async (_req: Request, res: Response) => {
  try {
    const materials = await prisma.freeMaterial.findMany({
      include: {
        test: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(materials);
  } catch (error) {
    console.error('Error fetching free materials:', error);
    return res.status(500).json({ error: 'Failed to fetch free materials' });
  }
};

export const deleteFreeMaterial = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.freeMaterial.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting free material:', error);
    return res.status(500).json({ error: 'Failed to delete free material' });
  }
};

// NEW: Folder + Content support
export const createFreeMaterialFolder = async (req: Request, res: Response) => {
  try {
    const { name, parentId, type } = req.body;

    const folder = await prisma.freeMaterialFolder.create({
      data: {
        name,
        parentId: parentId || null,
        type
      },
    });

    return res.status(201).json(folder);
  } catch (error) {
    console.error('Error creating folder:', error);
    return res.status(500).json({ error: 'Failed to create folder' });
  }
};

// export const updateFreeMaterialFolder = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const { name } = req.body;

//     const folder = await prisma.freeMaterialFolder.update({
//       where: { id },
//       data: { name },
//     });

//     return res.json(folder);
//   } catch (error) {
//     console.error('Error updating folder:', error);
//     return res.status(500).json({ error: 'Failed to update folder' });
//   }
// };

export const updateFreeMaterialFolder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Check if folder exists first
    const existing = await prisma.freeMaterialFolder.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    const folder = await prisma.freeMaterialFolder.update({
      where: { id },
      data: {
        name,
        type: existing.type,
      },
    });

    return res.json(folder);
  } catch (error) {
    console.error('Error updating folder:', error);
    return res.status(500).json({ error: 'Failed to update folder' });
  }
};

export const deleteFreeMaterialFolder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.freeMaterialFolder.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting folder:', error);
    return res.status(500).json({ error: 'Failed to delete folder' });
  }
};

// export const getAllFreeMaterialFolders = async (_req: Request, res: Response) => {
//   try {
//     const folders = await prisma.freeMaterialFolder.findMany({
//       include: {
//         children: true,
//         contents: true,
//       },
//       where: { parentId: null },
//       orderBy: { createdAt: 'desc' },
//     });
//     return res.json(folders);
//   } catch (error) { 
//     console.error('Error fetching folders:', error);
//     return res.status(500).json({ error: 'Failed to fetch folders' });
//   }
// };

export const getAllFreeMaterialFolders = async (req: Request, res: Response) => {
  try {
    const { type } = req.query;

    const folders = await prisma.freeMaterialFolder.findMany({
      where: {
        parentId: null,
        ...(type && { type: type as FreeMaterialType }),
      },
      include: {
        children: true,
        contents: type
          ? {
            where: {
              type: type as FreeMaterialType,
            },
          }
          : true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.json(folders);
  } catch (error) {
    console.error('Error fetching folders:', error);
    return res.status(500).json({ error: 'Failed to fetch folders' });
  }
};



export const createFreeMaterialContent = async (req: Request, res: Response) => {
  try {
    const { title, type, folderId, videoId, documentUrl, testId } = req.body;

    const data: any = {
      title,
      type,
      folderId,
    };

    if (type === 'VIDEO') data.videoId = videoId;
    if (type === 'DOCUMENT') data.documentUrl = documentUrl;
    if (type === 'TEST') data.testId = testId;

    const content = await prisma.freeMaterialContent.create({ data });
    return res.status(201).json(content);
  } catch (error) {
    console.error('Error creating content:', error);
    return res.status(500).json({ error: 'Failed to create content' });
  }
};

// export const updateFreeMaterialContent = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const { title, type } = req.body;

//     const updated = await prisma.freeMaterialContent.update({
//       where: { id },
//       data: { title,
//         type
//        },
//     });

//     return res.json(updated);
//   } catch (error) {
//     console.error('Error updating content:', error);
//     return res.status(500).json({ error: 'Failed to update content' });
//   }
// };
export const updateFreeMaterialContent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, type, videoId, documentUrl } = req.body;

    const updateData: any = { title, type };

    if (type === 'VIDEO') updateData.videoId = videoId;
    if (type === 'DOCUMENT') updateData.documentUrl = documentUrl;

    const updated = await prisma.freeMaterialContent.update({
      where: { id },
      data: updateData,
    });

    return res.json(updated);
  } catch (error) {
    console.error('Error updating content:', error);
    return res.status(500).json({ error: 'Failed to update content' });
  }
};


export const deleteFreeMaterialContent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.freeMaterialContent.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting content:', error);
    return res.status(500).json({ error: 'Failed to delete content' });
  }
};



// export const createFreeMaterialContent = async (req: Request, res: Response) => {
//   try {
//     const { title, type, folderId, videoId, documentUrl, testId } = req.body;

//     const data: any = { title, type, folderId };

//     if (type === 'VIDEO') {
//       const video = await prisma.video.findUnique({ where: { id: videoId } });
//       if (!video) return res.status(404).json({ error: 'Video not found' });
//       data.videoId = videoId;
//       data.videoUrl = video.url;
//     }

//     if (type === 'DOCUMENT') {
//       data.documentUrl = documentUrl;
//     }

//     if (type === 'TEST') {
//       data.testId = testId;
//     }

//     const content = await prisma.freeMaterialContent.create({ data });
//     return res.status(201).json(content);
//   } catch (error) {
//     console.error('Error creating content:', error);
//     return res.status(500).json({ error: 'Failed to create content' });
//   }
// };

// export const updateFreeMaterialContent = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const { title, type, videoId, documentUrl } = req.body;

//     const updateData: any = { title, type };

//     if (type === 'VIDEO') {
//       const video = await prisma.video.findUnique({ where: { id: videoId } });
//       if (!video) return res.status(404).json({ error: 'Video not found' });
//       updateData.videoId = videoId;
//       updateData.videoUrl = video.url;
//     }

//     if (type === 'DOCUMENT') {
//       updateData.documentUrl = documentUrl;
//     }

//     const updated = await prisma.freeMaterialContent.update({
//       where: { id },
//       data: updateData,
//     });

//     return res.json(updated);
//   } catch (error) {
//     console.error('Error updating content:', error);
//     return res.status(500).json({ error: 'Failed to update content' });
//   }
// };

// export const getAllFreeMaterialFolders = async (req: Request, res: Response) => {
//   try {
//     const { type } = req.query;

//     const folders = await prisma.freeMaterialFolder.findMany({
//       where: {
//         parentId: null,
//         ...(type && { type: type as FreeMaterialType }),
//       },
//       include: {
//         children: true,
//         contents: type
//           ? {
//               where: { type: type as FreeMaterialType },
//             }
//           : true,
//       },
//       orderBy: { createdAt: 'desc' },
//     });

//     return res.json(folders);
//   } catch (error) {
//     console.error('Error fetching folders:', error);
//     return res.status(500).json({ error: 'Failed to fetch folders' });
//   }
// };
