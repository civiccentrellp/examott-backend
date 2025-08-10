// /// <reference path="../../types/express/index.d.ts" />

// import express from 'express';
// import type { Request, Response } from 'express';
// import prisma from '../../utils/prisma.js';

// // Utility: calculate enrollment end date
// function calculateEndDate(pricingOption: any): Date {
//   if (!pricingOption) {
//     return new Date('2099-12-31'); // fallback lifetime
//   }
//   if (pricingOption.expiryDate) return pricingOption.expiryDate;
//   if (pricingOption.durationInDays) {
//     const endDate = new Date();
//     endDate.setDate(endDate.getDate() + pricingOption.durationInDays);
//     return endDate;
//   }
//   return new Date('2099-12-31');
// }

// // 🔸 Student: Create Payment Request
// // export const createPaymentRequest = async (req, res) => {
// //   try {
// //     const { courseId, screenshotUrl, amountPaid, pricingOptionId, installmentId , utrNumber } = req.body;
// //     const userId = req.user.id;

// //     const existing = await prisma.paymentRequest.findFirst({
// //       where: { userId, courseId, status: 'PENDING' },
// //     });
// //     if (existing) return res.status(400).json({ error: 'Already requested.' });

// //     const paymentRequest = await prisma.paymentRequest.create({
// //       data: { userId, courseId, screenshotUrl, amountPaid, pricingOptionId, installmentId, status: 'PENDING' },
// //     });

// //     return res.status(201).json(paymentRequest);
// //   } catch (error) {
// //     console.error('Create Payment Error:', error);
// //     return res.status(500).json({ error: 'Failed to create request' });
// //   }
// // };

// /**
//  * Create Payment Request
//  */
// export const createPaymentRequest = async (req, res) => {
//   try {
//     const {
//       courseId,
//       screenshotUrl,
//       amountPaid,
//       pricingOptionId,
//       installmentId,
//       utrNumber, // NEW
//     } = req.body;

//     const userId = req.user?.id;

//     // Basic required checks
//     if (!userId) return res.status(401).json({ error: 'Unauthorized' });
//     if (!courseId) return res.status(400).json({ error: 'courseId is required' });
//     if (!screenshotUrl) return res.status(400).json({ error: 'screenshotUrl is required' });

//     // Amount validation (optional)
//     if (amountPaid != null) {
//       const amt = Number(amountPaid);
//       if (Number.isNaN(amt) || amt <= 0) {
//         return res.status(400).json({ error: 'amountPaid must be a positive number' });
//       }
//     }

//     // Normalize UTR
//     const normalizedUtr = typeof utrNumber === 'string'
//       ? utrNumber.trim().toUpperCase()
//       : null;

//     // Block multiple pending for same user+course
//     const existing = await prisma.paymentRequest.findFirst({
//       where: { userId, courseId, status: 'PENDING' },
//       select: { id: true },
//     });
//     if (existing) {
//       return res.status(400).json({ error: 'Already requested.' });
//     }

//     // Optional: prevent duplicate UTR submissions globally
//     if (normalizedUtr) {
//       const utrExists = await prisma.paymentRequest.findFirst({
//         where: { utrNumber: normalizedUtr },
//         select: { id: true, status: true },
//       });
//       if (utrExists) {
//         return res.status(400).json({ error: 'This UTR has already been submitted.' });
//       }
//     }

//     // (Optional) sanity checks for pricingOptionId / installmentId relationships
//     if (pricingOptionId) {
//       const po = await prisma.coursePricingOption.findUnique({
//         where: { id: pricingOptionId },
//         select: { id: true, courseId: true },
//       });
//       if (!po || po.courseId !== courseId) {
//         return res.status(400).json({ error: 'Invalid pricingOptionId for this course' });
//       }
//     }

//     if (installmentId) {
//       const inst = await prisma.courseInstallment.findUnique({
//         where: { id: installmentId },
//         select: { id: true, pricingOptionId: true },
//       });
//       if (!inst) {
//         return res.status(400).json({ error: 'Invalid installmentId' });
//       }
//       if (pricingOptionId && inst.pricingOptionId !== pricingOptionId) {
//         return res.status(400).json({ error: 'installmentId does not belong to the given pricingOptionId' });
//       }
//     }

//     const paymentRequest = await prisma.paymentRequest.create({
//       data: {
//         userId,
//         courseId,
//         screenshotUrl,
//         amountPaid: amountPaid != null ? Number(amountPaid) : null,
//         status: 'PENDING',
//         pricingOptionId: pricingOptionId || null,
//         installmentId: installmentId || null,
//         utrNumber: normalizedUtr, // NEW
//       },
//     });

//     return res.status(201).json(paymentRequest);
//   } catch (error) {
//     console.error('Create Payment Error:', error);
//     return res.status(500).json({ error: 'Failed to create request' });
//   }
// };


// // 🔸 Admin: Verify & Enroll Student
// export const verifyPaymentAndEnroll = async (req, res) => {
//   try {
//     const { id } = req.params; // paymentRequestId
//     const { adminNote } = req.body;
//     const verifiedById = req.user.id;

//     const payment = await prisma.paymentRequest.findUnique({
//       where: { id },
//       include: {
//         pricingOption: { include: { course: true } },
//         installment: true,
//       },
//     });
//     if (!payment) return res.status(404).json({ error: 'Not found' });
//     if (payment.status === 'VERIFIED') return res.status(400).json({ error: 'Already verified' });

//     // Update payment status
//     const updatedPayment = await prisma.paymentRequest.update({
//       where: { id },
//       data: { status: 'VERIFIED', verifiedAt: new Date(), verifiedById, adminNote },
//     });

//     // Mark installment as paid (if applicable)
//     if (payment.installmentId) {
//       await prisma.courseInstallment.update({
//         where: { id: payment.installmentId },
//         data: { isPaid: true },
//       });
//     }

//     // Calculate validity
//     const startDate = new Date();
//     const endDate = calculateEndDate(payment.pricingOption);

//     // Upsert enrollment
//     const enrollment = await prisma.courseEnrollment.upsert({
//       where: { userId_courseId: { userId: payment.userId, courseId: payment.courseId } },
//       update: {
//         startDate,
//         endDate,
//         status: 'ACTIVE',
//         addedByAdmin: false,
//         pricingOptionId: payment.pricingOptionId,
//       },
//       create: {
//         userId: payment.userId,
//         courseId: payment.courseId,
//         startDate,
//         endDate,
//         status: 'ACTIVE',
//         pricingOptionId: payment.pricingOptionId,
//         accessType: payment.pricingOption?.course.accessType ?? 'SINGLE',
//         addedByAdmin: false,
//       },
//     });

//     return res.json({ updatedPayment, enrollment });
//   } catch (error) {
//     console.error('Verify & Enroll Error:', error);
//     return res.status(500).json({ error: 'Verification failed' });
//   }
// };

// // 🔸 Admin: Reject Request
// export const rejectPaymentRequest = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { adminNote } = req.body;
//     const verifiedById = req.user.id;

//     const updated = await prisma.paymentRequest.update({
//       where: { id },
//       data: { status: 'REJECTED', verifiedAt: new Date(), verifiedById, adminNote },
//     });

//     return res.json(updated);
//   } catch (error) {
//     console.error('Reject Error:', error);
//     return res.status(500).json({ error: 'Rejection failed' });
//   }
// };

// // 🔸 Student: Cancel Own Request
// export const cancelPaymentRequest = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const userId = req.user.id;

//     const request = await prisma.paymentRequest.findUnique({ where: { id } });
//     if (!request || request.userId !== userId) return res.status(403).json({ error: 'Unauthorized' });
//     if (request.status !== 'PENDING') return res.status(400).json({ error: 'Cannot cancel' });

//     await prisma.paymentRequest.delete({ where: { id } });
//     return res.status(204).send();
//   } catch (error) {
//     console.error('Cancel Error:', error);
//     return res.status(500).json({ error: 'Failed to cancel' });
//   }
// };

// // 🔸 Admin: View All Payment Requests
// export const getAllPaymentRequests = async (req, res) => {
//   try {
//     const data = await prisma.paymentRequest.findMany({
//       include: { user: true, course: true, verifiedBy: true, pricingOption: true, installment: true },
//       orderBy: { createdAt: 'desc' },
//     });
//     return res.json(data);
//   } catch (error) {
//     console.error('Fetch Payments Error:', error);
//     return res.status(500).json({ error: 'Failed to fetch requests' });
//   }
// };

// // 🔸 Student: View Own Payment Requests
// export const getMyPaymentRequests = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const data = await prisma.paymentRequest.findMany({
//       where: { userId },
//       include: { course: true, pricingOption: true, installment: true },
//       orderBy: { createdAt: 'desc' },
//     });
//     return res.json(data);
//   } catch (error) {
//     console.error('My Payments Error:', error);
//     return res.status(500).json({ error: 'Failed to fetch your requests' });
//   }
// };

// // 🔸 Student: View Enrollments
// export const getUserEnrollments = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const data = await prisma.courseEnrollment.findMany({
//       where: { userId },
//       include: { course: true, pricingOption: true },
//     });
//     return res.json(data);
//   } catch (error) {
//     console.error('Fetch Enrollments Error:', error);
//     return res.status(500).json({ error: 'Failed to fetch enrollments' });
//   }
// };

// // 🔸 Admin: View All Enrollments
// export const getAllEnrollments = async (req, res) => {
//   try {
//     const data = await prisma.courseEnrollment.findMany({
//       include: { course: true, user: true, pricingOption: true },
//       orderBy: { createdAt: 'desc' },
//     });
//     return res.json(data);
//   } catch (error) {
//     console.error('Fetch All Enrollments Error:', error);
//     return res.status(500).json({ error: 'Failed to fetch all enrollments' });
//   }
// };


/// <reference path="../../types/express/index.d.ts" />

import express from 'express';
import type { Request, Response } from 'express';
import prisma from '../../utils/prisma.js';

// ------------------------------
// Utility: calculate enrollment end date
// ------------------------------
function calculateEndDate(pricingOption?: { expiryDate?: Date | string | null; durationInDays?: number | null }): Date {
  if (!pricingOption) return new Date('2099-12-31'); // fallback lifetime
  if (pricingOption.expiryDate) return new Date(pricingOption.expiryDate);
  if (pricingOption.durationInDays && Number(pricingOption.durationInDays) > 0) {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + Number(pricingOption.durationInDays));
    return endDate;
  }
  return new Date('2099-12-31');
}

// ------------------------------
// Student: Create Payment Request
// ------------------------------
export const createPaymentRequest = async (req: Request, res: Response) => {
  try {
    const {
      courseId,
      screenshotUrl,
      amountPaid,
      pricingOptionId,
      installmentId,
      utrNumber,
    } = req.body;

    const userId = req.user?.id;

    // Basic required checks
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!courseId) return res.status(400).json({ error: 'courseId is required' });
    if (!screenshotUrl) return res.status(400).json({ error: 'screenshotUrl is required' });

    // Amount validation (optional)
    if (amountPaid != null) {
      const amt = Number(amountPaid);
      if (Number.isNaN(amt) || amt <= 0) {
        return res.status(400).json({ error: 'amountPaid must be a positive number' });
      }
    }

    // Normalize UTR
    const normalizedUtr = typeof utrNumber === 'string' ? utrNumber.trim().toUpperCase() : null;

    // Block multiple pending for same user+course
    const existing = await prisma.paymentRequest.findFirst({
      where: { userId, courseId, status: 'PENDING' },
      select: { id: true },
    });
    if (existing) return res.status(400).json({ error: 'Already requested.' });

    // Prevent duplicate UTR submissions (unless previous was REJECTED)
    if (normalizedUtr) {
      const utrExists = await prisma.paymentRequest.findFirst({
        where: {
          utrNumber: normalizedUtr,
          status: { in: ['PENDING', 'VERIFIED'] },
        },
        select: { id: true },
      });
      if (utrExists) return res.status(400).json({ error: 'This UTR has already been submitted.' });
    }

    // Sanity checks for pricingOptionId / installmentId
    if (pricingOptionId) {
      const po = await prisma.coursePricingOption.findUnique({
        where: { id: pricingOptionId },
        select: { id: true, courseId: true },
      });
      if (!po || po.courseId !== courseId) {
        return res.status(400).json({ error: 'Invalid pricingOptionId for this course' });
      }
    }

    if (installmentId) {
      const inst = await prisma.courseInstallment.findUnique({
        where: { id: installmentId },
        select: { id: true, pricingOptionId: true },
      });
      if (!inst) return res.status(400).json({ error: 'Invalid installmentId' });
      if (pricingOptionId && inst.pricingOptionId !== pricingOptionId) {
        return res.status(400).json({ error: 'installmentId does not belong to the given pricingOptionId' });
      }
    }

    const paymentRequest = await prisma.paymentRequest.create({
      data: {
        userId,
        courseId,
        screenshotUrl,
        amountPaid: amountPaid != null ? Number(amountPaid) : null,
        status: 'PENDING',
        pricingOptionId: pricingOptionId || null,
        installmentId: installmentId || null,
        utrNumber: normalizedUtr,
      },
    });

    return res.status(201).json(paymentRequest);
  } catch (error) {
    console.error('Create Payment Error:', error);
    return res.status(500).json({ error: 'Failed to create request' });
  }
};

// ------------------------------
// Admin: Verify & Enroll Student (Transactional)
// ------------------------------
export const verifyPaymentAndEnroll = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // paymentRequestId
    const { adminNote } = req.body;
    const verifiedById = req.user?.id;
    if (!verifiedById) return res.status(401).json({ error: 'Unauthorized' });

    const result = await prisma.$transaction(async (tx) => {
      // Load payment with relationships
      const payment = await tx.paymentRequest.findUnique({
        where: { id },
        include: {
          pricingOption: { include: { course: true } },
          installment: true,
        },
      });
      if (!payment) throw new Error('NOT_FOUND');
      if (payment.status === 'VERIFIED') throw new Error('ALREADY_VERIFIED');

      // 1) Verify payment
      const updatedPayment = await tx.paymentRequest.update({
        where: { id },
        data: { status: 'VERIFIED', verifiedAt: new Date(), verifiedById, adminNote },
        include: { course: true, user: true, pricingOption: true, installment: true },
      });

      // 2) Mark installment paid if applicable
      if (payment.installmentId) {
        await tx.courseInstallment.update({
          where: { id: payment.installmentId },
          data: { isPaid: true, paidAt: new Date() },
        });
      }

      // 3) Compute access window
      const startDate = new Date();
      const endDate = calculateEndDate(payment.pricingOption || undefined);

      // 4) Upsert enrollment
      const enrollment = await tx.courseEnrollment.upsert({
        where: { userId_courseId: { userId: payment.userId, courseId: payment.courseId } },
        update: {
          startDate,
          endDate,
          addedByAdmin: false,
          pricingOptionId: payment.pricingOptionId ?? undefined,
          accessType: payment.pricingOption?.course?.accessType ?? undefined,
        },
        create: {
          userId: payment.userId,
          courseId: payment.courseId,
          startDate,
          endDate,
          addedByAdmin: false,
          pricingOptionId: payment.pricingOptionId ?? undefined,
          accessType: payment.pricingOption?.course?.accessType ?? 'SINGLE',
        },
        include: { course: true, pricingOption: true, user: true },
      });

      return { updatedPayment, enrollment };
    });

    return res.json(result);
  } catch (error: any) {
    if (error?.message === 'NOT_FOUND') return res.status(404).json({ error: 'Not found' });
    if (error?.message === 'ALREADY_VERIFIED') return res.status(400).json({ error: 'Already verified' });
    console.error('Verify & Enroll Error:', error);
    return res.status(500).json({ error: 'Verification failed' });
  }
};

// ------------------------------
// Admin: Reject Request
// ------------------------------
export const rejectPaymentRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { adminNote } = req.body;
    const verifiedById = req.user?.id;
    if (!verifiedById) return res.status(401).json({ error: 'Unauthorized' });

    const updated = await prisma.paymentRequest.update({
      where: { id },
      data: { status: 'REJECTED', verifiedAt: new Date(), verifiedById, adminNote },
    });

    return res.json(updated);
  } catch (error) {
    console.error('Reject Error:', error);
    return res.status(500).json({ error: 'Rejection failed' });
  }
};

// ------------------------------
// Student: Cancel Own Request
// ------------------------------
export const cancelPaymentRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const request = await prisma.paymentRequest.findUnique({ where: { id } });
    if (!request || request.userId !== userId) return res.status(403).json({ error: 'Unauthorized' });
    if (request.status !== 'PENDING') return res.status(400).json({ error: 'Cannot cancel' });

    await prisma.paymentRequest.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    console.error('Cancel Error:', error);
    return res.status(500).json({ error: 'Failed to cancel' });
  }
};

// ------------------------------
// Admin: View All Payment Requests
// ------------------------------
export const getAllPaymentRequests = async (req: Request, res: Response) => {
  try {
    const data = await prisma.paymentRequest.findMany({
      include: {
        user: true,
        course: true,
        verifiedBy: true,
        pricingOption: true,
        installment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(data);
  } catch (error) {
    console.error('Fetch Payments Error:', error);
    return res.status(500).json({ error: 'Failed to fetch requests' });
  }
};

// ------------------------------
// Student: View Own Payment Requests
// ------------------------------
export const getMyPaymentRequests = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const data = await prisma.paymentRequest.findMany({
      where: { userId },
      include: { course: true, pricingOption: true, installment: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(data);
  } catch (error) {
    console.error('My Payments Error:', error);
    return res.status(500).json({ error: 'Failed to fetch your requests' });
  }
};

// ------------------------------
// Student: View Enrollments
// ------------------------------
export const getUserEnrollments = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const data = await prisma.courseEnrollment.findMany({
      where: { userId },
      include: { course: true, pricingOption: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(data);
  } catch (error) {
    console.error('Fetch Enrollments Error:', error);
    return res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
};

// ------------------------------
// Admin: View All Enrollments
// ------------------------------
export const getAllEnrollments = async (req: Request, res: Response) => {
  try {
    const data = await prisma.courseEnrollment.findMany({
      include: { course: true, user: true, pricingOption: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(data);
  } catch (error) {
    console.error('Fetch All Enrollments Error:', error);
    return res.status(500).json({ error: 'Failed to fetch all enrollments' });
  }
};
