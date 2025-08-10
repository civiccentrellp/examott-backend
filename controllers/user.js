// // controllers/user.js
// import prisma from "../prisma/prismaClient.js";
// export const getCurrentUser = async (req, res) => {
//   try {
//     const user = await prisma.user.findUnique({
//       where: { id: req.user.id },
//       select: {
//         id: true,
//         name: true,
//         email: true,
//         role: true,
//         isVerified: true,
//         lastLogin: true,
//         createdAt: true,
//       },
//     });
//     res.json(user);
//   } catch (error) {
//     console.error("Get Current User Error:", error);
//     res.status(500).json({ message: "Something went wrong" });
//   }
// };

// import prisma from "../prisma/prismaClient.js";

// export const mergeUserPermissions = (user) => {
//   const rolePermissions =
//     user?.role?.rolePermissions?.map((rp) => ({
//       id: rp.permission.id,
//       name: rp.permission.name,
//       label: rp.permission.label,
//     })) ?? [];

//   const userPermissions =
//     user?.userPermissions?.map((up) => ({
//       id: up.permission.id,
//       name: up.permission.name,
//       label: up.permission.label,
//     })) ?? [];

//   const allPermissionsMap = new Map();
//   [...rolePermissions, ...userPermissions].forEach((p) => {
//     allPermissionsMap.set(p.name, p);
//   });

//   return {
//     rolePermissions,
//     userPermissions,
//     allPermissions: Array.from(allPermissionsMap.values()),
//   };
// };

// export const getCurrentUser = async (req, res) => {
//   try {
//     const user = await prisma.user.findUnique({
//       where: { id: req.user.id },
//       include: {
//         role: {
//           include: {
//             rolePermissions: {
//               include: {
//                 permission: true,
//               },
//             },
//           },
//         },
//         userPermissions: {
//           include: {
//             permission: true,
//           },
//         },
//       },
//     });

//     if (!user) return res.status(404).json({ message: "User not found" });
//         console.dir(user, { depth: null });

//     const { rolePermissions, userPermissions, allPermissions } =
//       mergeUserPermissions(user);

//     res.json({
//       id: user.id,
//       name: user.name,
//       email: user.email,
//       mobile: user.mobile,
//       profilePicture: user.profilePicture,
//       isVerified: user.isVerified,
//       lastLogin: user.lastLogin,
//       createdAt: user.createdAt,

//       role: user.role
//         ? {
//             id: user.role.id,
//             name: user.role.name,
//             label: user.role.label,
//             createdAt: user.role.createdAt,
//             permissions: rolePermissions,
//           }
//         : undefined,

//       permissions: userPermissions,
//       allPermissions,
//     });
//   } catch (error) {
//     console.error("Get Current User Error:", error);
//     res.status(500).json({ message: "Something went wrong" });
//   }
// };
// import prisma from "../prisma/prismaClient.js";
import prisma from "../utils/prisma.js";

export const mergeUserPermissions = (user) => {
  const rolePermissions =
    user?.role?.rolePermissions?.map((rp) => ({
      id: rp.permission.id,
      name: rp.permission.name,
      label: rp.permission.label,
    })) ?? [];

  const userPermissions =
    user?.userPermissions?.map((up) => ({
      id: up.permission.id,
      name: up.permission.name,
      label: up.permission.label,
    })) ?? [];

  const allPermissionsMap = new Map();
  [...rolePermissions, ...userPermissions].forEach((p) => {
    allPermissionsMap.set(p.name, p);
  });

  return {
    rolePermissions,
    userPermissions,
    allPermissions: Array.from(allPermissionsMap.values()),
  };
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
        userPermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    const { rolePermissions, userPermissions, allPermissions } =
      mergeUserPermissions(user);

    // Debug to confirm what Prisma returned
    console.log(
      "🧠 rolePermissions from DB:",
      user?.role?.rolePermissions?.length
    );
    console.dir(user.role?.rolePermissions, { depth: null });

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      profilePicture: user.profilePicture,
      isVerified: user.isVerified,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,

      role: user.role
        ? {
            id: user.role.id,
            name: user.role.name,
            label: user.role.label,
            createdAt: user.role.createdAt,
            permissions: rolePermissions,
          }
        : undefined,

      permissions: userPermissions,
      allPermissions,
    });
  } catch (error) {
    console.error("Get Current User Error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
