import express from 'express';
import type { Request, Response } from 'express';
import prisma from '../../utils/prisma.js';
import moment from 'moment';

// Create multiple installments (auto-generate with period)
export const createInstallments = async (req: Request, res: Response) => {
  const {
    courseId,
    pricingOptionId,
    totalInstallments,
    installmentPeriod,
    effectivePrice,
    customDueDates,
    startDate,
  } = req.body;

  try {
    const [course, pricingOption] = await Promise.all([
      prisma.course.findUnique({ where: { id: courseId } }),
      prisma.coursePricingOption.findUnique({ where: { id: pricingOptionId }, include: { course: true } }),
    ]);

    if (!course) return res.status(400).json({ success: false, message: "Invalid courseId" });
    if (!pricingOption) return res.status(400).json({ success: false, message: "Invalid pricingOptionId" });

    if (pricingOption.course.accessType === "LIFETIME") {
      return res.status(400).json({
        success: false,
        message: "Installments are not allowed for LIFETIME access type",
      });
    }

    const totalAmount = parseFloat(effectivePrice);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid effective price" });
    }

    const baseDate = startDate ? moment(startDate) : moment();
    const perInstallment = Math.floor((totalAmount / totalInstallments) * 100) / 100;
    const lastAmount = parseFloat((totalAmount - perInstallment * (totalInstallments - 1)).toFixed(2));

    const installmentData = Array.from({ length: totalInstallments }).map((_, i) => {
      let dueDate: Date;

      if (installmentPeriod === "Custom Date") {
        if (!customDueDates || !customDueDates[i]) {
          throw new Error(`Missing due date for installment ${i + 1}`);
        }
        dueDate = new Date(customDueDates[i]);
      } else {
        const { unit, value } = getPeriodGap(installmentPeriod);
        dueDate = baseDate.clone().add(value * i, unit).toDate();
      }

      return {
        courseId,
        pricingOptionId,
        label: `${i + 1} Installment`,
        amount: i === totalInstallments - 1 ? lastAmount : perInstallment,
        dueDate,
        isPaid: false,
      };
    });

    // Check total of all installments
    const totalFromInstallments = installmentData.reduce((sum, inst) => sum + inst.amount, 0);
    const diff = Math.abs(totalFromInstallments - totalAmount);

    if (diff > 0.01) {
      throw new Error("Installment total does not match effective price");
    }
    // ❗️ Delete existing installments for this pricingOptionId
    await prisma.courseInstallment.deleteMany({
      where: { pricingOptionId },
    });

    const created = await prisma.courseInstallment.createMany({ data: installmentData });

    res.status(201).json({
      success: true,
      message: "Installments created",
      data: created,
    });
  } catch (err) {
    console.error("Error creating installments:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to create installments" });
  }
};

function getPeriodGap(period: string): { unit: moment.unitOfTime.DurationConstructor, value: number } {
  switch (period.toLowerCase()) {
    case "weekly": return { unit: "weeks", value: 1 };
    case "bi-weekly": return { unit: "weeks", value: 2 };
    case "monthly": return { unit: "months", value: 1 };
    case "every 2 months": return { unit: "months", value: 2 };
    case "every 3 months": return { unit: "months", value: 3 };
    case "every 6 months": return { unit: "months", value: 6 };
    default: throw new Error("Unsupported installment period");
  }
}

// Update a single installment
export const updateInstallment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { label, amount, dueDate, isPaid } = req.body;

  try {
    const updated = await prisma.courseInstallment.update({
      where: { id },
      data: {
        label,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        isPaid,
      },
    });

    res.json({ success: true, message: "Installment updated", data: updated });
  } catch (err) {
    console.error("Error updating installment:", err);
    res.status(500).json({ success: false, message: "Failed to update installment" });
  }
};

// Delete an installment
export const deleteInstallment = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.courseInstallment.delete({ where: { id } });
    res.json({ success: true, message: "Installment deleted" });
  } catch (err) {
    console.error("Error deleting installment:", err);
    res.status(500).json({ success: false, message: "Failed to delete installment" });
  }
};

// Get all installments for a pricing option
export const getInstallmentsByPricingOption = async (req: Request, res: Response) => {
  const { pricingOptionId } = req.params;

  try {
    const data = await prisma.courseInstallment.findMany({
      where: { pricingOptionId },
      orderBy: { dueDate: "asc" },
    });

    res.json({ success: true, data });
  } catch (err) {
    console.error("Error fetching installments:", err);
    res.status(500).json({ success: false, message: "Failed to fetch installments" });
  }
};

// Get all installments for a courseId
export const getInstallmentsByCourse = async (req: Request, res: Response) => {
  const { courseId } = req.params;

  try {
    const data = await prisma.courseInstallment.findMany({
      where: { courseId },
      orderBy: { dueDate: "asc" },
    });

    res.json({ success: true, data });
  } catch (err) {
    console.error("Error fetching course installments:", err);
    res.status(500).json({ success: false, message: "Failed to fetch course installments" });
  }
};
