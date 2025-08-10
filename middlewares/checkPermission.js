// import prisma from "../prisma/prismaClient.js";
import prisma from "../utils/prisma.js";

export const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          role: {
            include: {
              rolePermissions: {
                include: { permission: true },
              },
            },
          },
          userPermissions: {
            include: { permission: true },
          },
        },
      });

      const rolePermissions = user?.role?.rolePermissions.map(rp => rp.permission.name) || [];
      const userPermissions = user?.userPermissions.map(up => up.permission.name) || [];
      const allPermissions = [...new Set([...rolePermissions, ...userPermissions])];

      if (!allPermissions.includes(requiredPermission)) {
        return res.status(403).json({ message: "Permission denied" });
      }

      next();
    } catch (error) {
      console.error("Permission check error:", error);
      res.status(500).json({ message: "Server error during permission check" });
    }
  };
};
