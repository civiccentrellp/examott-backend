// import prisma from "../prisma/prismaClient.js";
import prisma from "../utils/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { generateToken } from "../utils/jwt.js";

export const signup = async (req, res) => {
  const { name, email, password, mobile } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    let role = await prisma.role.findUnique({ where: { name: "STUDENT" } });

    if (!role) {
      role = await prisma.role.create({
        data: {
          name: "STUDENT",
          label: "Student",
        },
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        mobile,
        roleId: role.id,
      },
    });

    // const token = generateToken(user); // ✅ directly pass full user
    // const token = generateToken(newUser);

    const token = generateToken({
      id: newUser.id,
      role: "student", // hardcoded or fetched cleanly
    });

    res.status(201).json({ user: newUser, token });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user)
      return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password" });

    // const token = generateToken(user); // ✅ directly pass full user

    const token = generateToken({
      id: user.id,
      role: user.role?.name?.toLowerCase(), // ensure lowercase string
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    res.json({ user, token });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
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

    if (!user) return res.status(404).json({ message: "User not found" });

    // Flatten permissions
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
      allPermissions: Array.from(allPermissionsMap.values()),
    });
  } catch (error) {
    console.error("Get current user error:", error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
