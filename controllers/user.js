// controllers/user.js
import prisma from "../prisma/prismaClient.js";
export const getCurrentUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        lastLogin: true,
        createdAt: true,
      },
    });
    res.json(user);
  } catch (error) {
    console.error("Get Current User Error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
