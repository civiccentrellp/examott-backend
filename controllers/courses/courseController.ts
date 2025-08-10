import type { Request, Response } from "express";
import prisma from "../../utils/prisma.js";
import moment from "moment/moment.js";

// ==========================
// Get All Courses
// ==========================
export const getAllCourses = async (req: Request, res: Response) => {
  const {
    page = "1",
    limit = "10",
    goal,
    status,
    accessType,
    search,
  } = req.query as {
    page?: string;
    limit?: string;
    goal?: string;
    status?: string;
    accessType?: string;
    search?: string;
  };

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where: any = {};
  // ✅ Normalize role for safety
  const role = typeof req.user?.role === "string" ? req.user.role.toLowerCase() : undefined;

  // ✅ Filter based on role
  if (!req.user || role === "student") {
    where.status = "PUBLISH_PUBLIC";
  } else if (status) {
    where.status = status;
  }


  if (goal) where.goal = goal;
  // if (status) where.status = status;
  if (accessType) where.accessType = accessType;
  if (search) {
    where.name = {
      contains: search,
      mode: "insensitive",
    };
  }


  // ✅ Debug logs
  console.log("role:", role);
  console.log("where:", where);


  try {
    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
        include: { pricingOptions: true },
      }),
      prisma.course.count({ where }),
    ]);

    res.json({
      success: true,
      data: courses,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ success: false, message: "Database query failed" });
  }
};

// ==========================
// Get Course By Id
// ==========================
export const getCourseById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const role = req.user?.role;

  try {
    const course = await prisma.course.findUnique({
      where: { id },
      include: { pricingOptions: true },
    });

    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    if (role === "student") {
      if (!["PUBLISH_PUBLIC", "PUBLISH_PRIVATE"].includes(course.status)) {
        return res
          .status(403)
          .json({ success: false, message: "Access denied for this course" });
      }
    }

    res.json({ success: true, data: course });
  } catch (err) {
    console.error("Error fetching course:", err);
    res
      .status(500)
      .json({ success: false, message: "Database query failed" });
  }
};

// ==========================
// Create Course
// ==========================
export const createCourse = async (req: Request, res: Response) => {
  const {
    name,
    description,
    thumbnail,
    videoUrl,
    goal,
    status,
    accessType,
    pricingOptions = [],
  } = req.body;

  try {
    // const validatedPricingOptions = pricingOptions.map((opt: any) => {
    //   const price = parseFloat(opt.price);
    //   const discount = parseFloat(opt.discount ?? 0);
    //   if (isNaN(price)) throw new Error("Invalid price value");
    //   if (isNaN(discount)) throw new Error("Invalid discount value");

    //   const effectivePrice = price - discount;

    //   if (["SINGLE", "MULTIPLE"].includes(accessType) && !opt.durationInDays) {
    //     throw new Error(`durationInDays is required for ${accessType}`);
    //   }
    //   if (accessType === "EXPIRY_DATE" && !opt.expiryDate) {
    //     throw new Error(`expiryDate is required for EXPIRY_DATE`);
    //   }
    //   if (accessType === "LIFETIME" && (opt.durationInDays || opt.expiryDate)) {
    //     throw new Error(
    //       "LIFETIME should not have durationInDays or expiryDate"
    //     );
    //   }

    //   return {
    //     durationInDays: opt.durationInDays ?? null,
    //     expiryDate: opt.expiryDate ? new Date(opt.expiryDate) : null,
    //     price,
    //     discount,
    //     effectivePrice,
    //     promoted: opt.promoted ?? false,
    //   };
    // });
    const validatedPricingOptions = pricingOptions.map((opt: any) => {
      const price = parseFloat(opt.price);
      const discount = parseFloat(opt.discount ?? 0);
      const effectivePrice = price - discount;

      if (accessType === "MULTIPLE" && !opt.durationInDays) {
        throw new Error("durationInDays is required for MULTIPLE pricing options");
      }

      let expiryDate: Date | null = null;
      if (accessType === "EXPIRY_DATE") {
        if (!opt.expiryDate) throw new Error(`expiryDate is required for EXPIRY_DATE`);
        const parsed = moment(opt.expiryDate);
        if (!parsed.isValid()) throw new Error("Invalid expiryDate format");
        expiryDate = parsed.toDate();
      }

      if (accessType === "LIFETIME" && (opt.durationInDays || opt.expiryDate)) {
        throw new Error("LIFETIME should not have durationInDays or expiryDate");
      }

      return {
        durationInDays: opt.durationInDays ?? null,
        expiryDate,
        price,
        discount,
        effectivePrice,
        promoted: opt.promoted ?? false,
      };
    });

    const course = await prisma.course.create({
      data: {
        name,
        description,
        thumbnail,
        videoUrl,
        goal,
        status,
        accessType,
        ...(validatedPricingOptions.length > 0 && {
          pricingOptions: { create: validatedPricingOptions },
        }),
      },
      include: { pricingOptions: true },
    });

    res
      .status(201)
      .json({ success: true, message: "Course created", data: course });
  } catch (err: any) {
    console.error("Error creating course:", err);
    res
      .status(500)
      .json({
        success: false,
        message: err.message || "Failed to create course",
      });
  }
};

// ==========================
// Update Course
// ==========================
export const updateCourse = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    name,
    description,
    thumbnail,
    videoUrl,
    status,
    accessType,
    pricingOptions = [],
  } = req.body;

  try {
    const validatedPricingOptions = pricingOptions.map((opt: any) => {
      const price = parseFloat(opt.price);
      const discount = parseFloat(opt.discount ?? 0);
      const effectivePrice = price - discount;

      if (["SINGLE", "MULTIPLE"].includes(accessType) && !opt.durationInDays) {
        throw new Error(`durationInDays is required for ${accessType}`);
      }
      if (accessType === "EXPIRY_DATE" && !opt.expiryDate) {
        throw new Error(`expiryDate is required for EXPIRY_DATE`);
      }
      if (accessType === "LIFETIME" && (opt.durationInDays || opt.expiryDate)) {
        throw new Error(
          "LIFETIME should not have durationInDays or expiryDate"
        );
      }

      return {
        durationInDays: opt.durationInDays ?? null,
        expiryDate: opt.expiryDate ? new Date(opt.expiryDate) : null,
        price,
        discount,
        effectivePrice,
        promoted: opt.promoted ?? false,
      };
    });

    const updated = await prisma.course.update({
      where: { id },
      data: {
        name,
        description,
        thumbnail,
        videoUrl,
        status,
        accessType,
        pricingOptions: {
          deleteMany: {},
          create: validatedPricingOptions,
        },
      },
      include: { pricingOptions: true },
    });

    res.json({ success: true, message: "Course updated", data: updated });
  } catch (err: any) {
    console.error("Error updating course:", err);
    res
      .status(500)
      .json({
        success: false,
        message: err.message || "Failed to update course",
      });
  }
};

// ==========================
// Delete Course
// ==========================
export const deleteCourse = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.course.delete({ where: { id } });
    res.json({ success: true, message: "Course deleted" });
  } catch (err) {
    console.error("Error deleting course:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete course" });
  }
};

// ==========================
// Update Pricing Option
// ==========================
export const updateCoursePricingOption = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { durationInDays, expiryDate, price, discount, promoted } = req.body;

  try {
    const pricingOption = await prisma.coursePricingOption.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!pricingOption) {
      return res
        .status(404)
        .json({ success: false, message: "Pricing option not found" });
    }

    const accessType = pricingOption.course.accessType;

    if (["SINGLE", "MULTIPLE"].includes(accessType) && !durationInDays) {
      throw new Error(`durationInDays is required for ${accessType}`);
    }
    if (accessType === "EXPIRY_DATE" && !expiryDate) {
      throw new Error(`expiryDate is required for EXPIRY_DATE`);
    }
    if (accessType === "LIFETIME" && (durationInDays || expiryDate)) {
      throw new Error("LIFETIME should not have durationInDays or expiryDate");
    }

    const parsedPrice = parseFloat(price);
    const parsedDiscount = parseFloat(discount ?? 0);
    const effectivePrice = parsedPrice - parsedDiscount;

    const updated = await prisma.coursePricingOption.update({
      where: { id },
      data: {
        durationInDays: durationInDays ?? null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        price: parsedPrice,
        discount: parsedDiscount,
        effectivePrice,
        promoted: promoted ?? false,
      },
    });

    res.json({ success: true, message: "Pricing option updated", data: updated });
  } catch (err: any) {
    console.error("Error updating pricing option:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to update pricing option" });
  }
};
