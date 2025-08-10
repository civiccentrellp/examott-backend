// utils/enrollment.ts
import express from 'express';
import type { Request, Response } from 'express';
import prisma from '../../utils/prisma.js';
import type { PaymentTransaction, CoursePricingOption, Course } from "@prisma/client";



export async function enrollUser(transaction: PaymentTransaction) {
    const course = await prisma.course.findUnique({
        where: { id: transaction.courseId },
        select: { accessType: true },
    });

    const pricingOption = await prisma.coursePricingOption.findUnique({
        where: { id: transaction.pricingOptionId! },
    });

    if (!course || !pricingOption) return;

    const existingEnrollment = await prisma.courseEnrollment.findUnique({
        where: {
            userId_courseId: {
                userId: transaction.userId,
                courseId: transaction.courseId,
            },
        },
    });

    if (existingEnrollment) return;

    const now = new Date();
    let endDate: Date;

    switch (course.accessType) {
        case "LIFETIME":
            endDate = new Date(9999, 11, 31);
            break;
        case "EXPIRY_DATE":
            if (!pricingOption.expiryDate) throw new Error("Missing expiry date");
            endDate = pricingOption.expiryDate;
            break;
        default:
            if (!pricingOption.durationInDays) throw new Error("Missing duration");
            endDate = new Date(now.getTime() + pricingOption.durationInDays * 86400000);
    }

    await prisma.courseEnrollment.create({
        data: {
            userId: transaction.userId,
            courseId: transaction.courseId,
            accessType: course.accessType,
            pricingOptionId: transaction.pricingOptionId,
            startDate: now,
            endDate,
            addedByAdmin: false,
        },
    });
}

export const getUserEnrollments = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        if (!userId) return res.status(400).json({ error: "User ID is required" });

        const enrollments = await prisma.courseEnrollment.findMany({
            where: { userId },
            select: {
                id: true,
                courseId: true,
                accessType: true,
                startDate: true,
                endDate: true,
                addedByAdmin: true,
            },
        });

        res.status(200).json(enrollments);
    } catch (error) {
        console.error("Error fetching user enrollments:", error);
        res.status(500).json({ error: "Failed to fetch enrollments" });
    }
};

/**
 * Get all enrolled courses with full course details for a user
 */
export const getUserEnrolledCourses = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        if (!userId) return res.status(400).json({ error: "User ID is required" });

        const courses = await prisma.courseEnrollment.findMany({
            where: { userId },
            include: {
                course: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        thumbnail: true,
                        goal: true,
                        accessType: true,
                        status: true,
                        pricingOptions: {
                            select: {
                                id: true,
                                price: true,
                                discount: true,
                                effectivePrice: true,
                                durationInDays: true,
                                expiryDate: true,
                                promoted: true,
                            },
                        },
                    },
                },
            },
        });

        res.status(200).json(courses);
    } catch (error) {
        console.error("Error fetching user enrolled courses:", error);
        res.status(500).json({ error: "Failed to fetch enrolled courses" });
    }
};

// export const getUserEnrolledCourses = async (req: Request, res: Response) => {
//   try {
//     const { userId } = req.params;
//     if (!userId) return res.status(400).json({ error: "User ID is required" });

//     const courses = await prisma.courseEnrollment.findMany({
//       where: { userId },
//       include: {
//         course: {
//           include: { pricingOptions: true }, // FULL COURSE
//         },
//       },
//     });

//     res.status(200).json(courses);
//   } catch (error) {
//     console.error("Error fetching user enrolled courses:", error);
//     res.status(500).json({ error: "Failed to fetch enrolled courses" });
//   }
// };


/**
 * Add a user enrollment manually (Admin or Payment flow)
 */
export const addUserEnrollment = async (req: Request, res: Response) => {
    try {
        const { userId, courseId, pricingOptionId, accessType, startDate, endDate } = req.body;

        if (!userId || !courseId) {
            return res.status(400).json({ error: "userId and courseId are required" });
        }

        // Prevent duplicate enrollment
        const existing = await prisma.courseEnrollment.findUnique({
            where: { userId_courseId: { userId, courseId } },
        });

        if (existing) return res.status(200).json(existing);

        const enrollment = await prisma.courseEnrollment.create({
            data: {
                userId,
                courseId,
                pricingOptionId,
                accessType,
                startDate: startDate ? new Date(startDate) : new Date(),
                endDate: endDate ? new Date(endDate) : new Date(9999, 11, 31),
                addedByAdmin: true,
            },
        });

        res.status(201).json(enrollment);
    } catch (error) {
        console.error("Error adding user enrollment:", error);
        res.status(500).json({ error: "Failed to add enrollment" });
    }
};

/**
 * Remove a user enrollment (Admin feature)
 */
export const removeUserEnrollment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ error: "Enrollment ID is required" });

        await prisma.courseEnrollment.delete({
            where: { id },
        });

        res.status(200).json({ message: "Enrollment removed successfully" });
    } catch (error) {
        console.error("Error removing enrollment:", error);
        res.status(500).json({ error: "Failed to remove enrollment" });
    }
};

// Update last opened course (based on enrollment)
export const updateLastOpenedCourse = async (req: Request, res: Response) => {
  try {
    const { userId, enrollmentId } = req.body;
    if (!userId || !enrollmentId) {
      return res.status(400).json({ error: "Missing userId or enrollmentId" });
    }

    // Validate that this enrollment belongs to the same user
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: { id: enrollmentId },
    });
    if (!enrollment || enrollment.userId !== userId) {
      return res.status(400).json({ error: "Invalid enrollmentId for this user" });
    }

    const record = await prisma.userLastOpenedCourse.upsert({
      where: { userId },
      update: { enrollmentId, updatedAt: new Date() },
      create: { userId, enrollmentId },
      include: {
        enrollment: { include: { course: true } },
      },
    });

    res.status(200).json(record);
  } catch (error) {
    console.error("Error updating last opened course:", error);
    res.status(500).json({ error: "Failed to update last opened course" });
  }
};

// Get last opened course
export const getLastOpenedCourse = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: "User ID is required" });

    const record = await prisma.userLastOpenedCourse.findUnique({
      where: { userId },
      include: {
        enrollment: {
          include: {
            course: { include: { pricingOptions: true } },
          },
        },
      },
    });

    if (!record) return res.status(404).json({ error: "No last opened course found" });

    res.status(200).json(record.enrollment.course);
  } catch (error) {
    console.error("Error fetching last opened course:", error);
    res.status(500).json({ error: "Failed to fetch last opened course" });
  }
};
