import express from 'express';
import type { Request, Response } from 'express';
import prisma from '../../utils/prisma.js';

export const addManualEnrollment = async (req: Request, res: Response) => {
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

    // Default dates if not provided
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(9999, 11, 31);

    const enrollment = await prisma.courseEnrollment.create({
      data: {
        userId,
        courseId,
        pricingOptionId,
        accessType,
        startDate: start,
        endDate: end,
        status: "PENDING",
        addedByAdmin: true,
      },
    });

    res.status(201).json(enrollment);
  } catch (error) {
    console.error("Error adding manual enrollment:", error);
    res.status(500).json({ error: "Failed to add enrollment" });
  }
};

/**
 * Approve pending enrollment (Admin) → status ACTIVE
 */
export const approvePendingEnrollment = async (req: Request, res: Response) => {
  try {
    const { enrollmentId } = req.body;
    if (!enrollmentId) return res.status(400).json({ error: "enrollmentId is required" });

    const enrollment = await prisma.courseEnrollment.findUnique({ where: { id: enrollmentId } });
    if (!enrollment) return res.status(404).json({ error: "Enrollment not found" });

    const pricingOption = enrollment.pricingOptionId
      ? await prisma.coursePricingOption.findUnique({ where: { id: enrollment.pricingOptionId } })
      : null;

    const now = new Date();
    let endDate: Date;
    switch (enrollment.accessType) {
      case "LIFETIME":
        endDate = new Date(9999, 11, 31);
        break;
      case "EXPIRY_DATE":
        if (!pricingOption?.expiryDate) throw new Error("Missing expiry date");
        endDate = pricingOption.expiryDate;
        break;
      default:
        if (!pricingOption?.durationInDays) throw new Error("Missing duration");
        endDate = new Date(now.getTime() + pricingOption.durationInDays * 86400000);
    }

    const updated = await prisma.courseEnrollment.update({
      where: { id: enrollmentId },
      data: { status: "ACTIVE", startDate: now, endDate },
    });

    res.status(200).json(updated);
  } catch (error) {
    console.error("Error approving enrollment:", error);
    res.status(500).json({ error: "Failed to approve enrollment" });
  }
};

/**
 * Get all enrollments (Admin) → with course & user details
 */
export const getAllEnrollments = async (req: Request, res: Response) => {
  try {
    const enrollments = await prisma.courseEnrollment.findMany({
      include: {
        course: true,
        user: true,
        pricingOption: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(enrollments);
  } catch (error) {
    console.error("Error fetching enrollments:", error);
    res.status(500).json({ error: "Failed to fetch enrollments" });
  }
};

/**
 * Get single enrollment by ID (Admin)
 */
export const getEnrollmentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: { id },
      include: { course: true, user: true, pricingOption: true },
    });

    if (!enrollment) return res.status(404).json({ error: "Enrollment not found" });

    res.status(200).json(enrollment);
  } catch (error) {
    console.error("Error fetching enrollment:", error);
    res.status(500).json({ error: "Failed to fetch enrollment" });
  }
};

/**
 * Update enrollment (Admin) → can change accessType, status, dates
 */
export const updateEnrollment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { accessType, status, startDate, endDate, pricingOptionId } = req.body;

    const updated = await prisma.courseEnrollment.update({
      where: { id },
      data: {
        accessType,
        status,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        pricingOptionId,
      },
    });

    res.status(200).json(updated);
  } catch (error) {
    console.error("Error updating enrollment:", error);
    res.status(500).json({ error: "Failed to update enrollment" });
  }
};

/**
 * Remove enrollment (Admin)
 */
export const removeManualEnrollment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.courseEnrollment.delete({ where: { id } });
    res.status(200).json({ message: "Enrollment removed successfully" });
  } catch (error) {
    console.error("Error removing enrollment:", error);
    res.status(500).json({ error: "Failed to remove enrollment" });
  }
};
