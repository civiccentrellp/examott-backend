import dotenv from "dotenv";
dotenv.config({
  path:
    process.env.NODE_ENV === "production" ? ".env.production" : ".env.local",
});

import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import prisma from "./utils/prisma.js";

import admin from "firebase-admin";
import courseRoutes from "./routes/courses/courseRoutes.ts";
import courseContentRoutes from "./routes/courses/courseContentRoutes.ts";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users/userRoutes.ts";
import subjectRoutes from "./routes/dbms/subjectRoutes.ts";
import chapterRoutes from "./routes/dbms/chapterRoutes.ts";
import topicRoutes from "./routes/dbms/topicRoutes.ts";
import subTopicRoutes from "./routes/dbms/subTopicRoutes.ts";
import questionRoutes from "./routes/dbms/questionRoutes.ts";
import videoRoutes from "./routes/dbms/videoRoutes.ts";
import { authenticate } from "./middlewares/auth.ts";
import attachmentRoutes from "./routes/dbms/attachmentRoutes.ts";
import optionRoutes from "./routes/dbms/optionRoutes.ts";
import poolRoutes from "./routes/dbms/poolRoutes.ts";
import videoFolderRoutes from "./routes/dbms/videoFolderRoutes.ts";
import testRoutes from "./routes/tests/testRoutes.ts";
import courseFaqsRoutes from "./routes/courses/courseFaqsRoutes.ts";
import permissionRoutes from "./routes/permissions/permissionRoutes.ts";
import rolePermissionRoutes from "./routes/permissions/rolePermissionRoutes.ts";
import userPermissionRoutes from "./routes/permissions/userPermissionRoutes.ts";
import roleRoutes from "./routes/roles/roleRoutes.ts";
import freeMaterialRoutes from "./routes/freeMaterial/freeMaterialRoutes.ts";
import testAttemptRoutes from "./routes/tests/attemptRoutes.ts";
import courseInstallmentRoutes from "./routes/courses/courseInstallmentRoutes.ts";
import paymentRoutes from "./routes/payments/RazorpayPaymentsRoutes.ts";
import webhookRoutes from "./routes/webHooks/razorpayWebhookRoutes.ts";
import enrollmentRoutes from "./routes/courses/courseEnrollmentRoutes.ts";
import reportRoutes from "./routes/tests/reports/reportRoutes.ts";
import mPaymentRoutes from "./routes/courses/courseAccessRoutes.ts";

// Express app setup
const app = express();

const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3000"],
  credentials: true,
  methods: "GET, POST, PUT, DELETE, OPTIONS",
  allowedHeaders: "Content-Type, Authorization",
};

app.use(cors(corsOptions));
app.use(express.json());

// --- Health check to confirm DB connectivity (helps diagnose pool starvation) ---
app.get("/healthz", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// Routes
app.use("/api/courses", courseContentRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/courses", courseFaqsRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/chapters", chapterRoutes);
app.use("/api/topics", topicRoutes);
app.use("/api/subTopics", subTopicRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/video-folders", videoFolderRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/question-attachments", attachmentRoutes);
app.use("/api/question-options", optionRoutes);
app.use("/api/pools", poolRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/role-permissions", rolePermissionRoutes);
app.use("/api/user-permissions", userPermissionRoutes);
app.use("/api/free-material", freeMaterialRoutes);
app.use("/api/test", testAttemptRoutes);
app.use("/api/installments", courseInstallmentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/m-payments", mPaymentRoutes);
app.use("/api/webhook", webhookRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/reports", reportRoutes);

app.get("/", (_req, res) => {
  res.send("Backend API is running with WebSocket support!");
});

// --- Create HTTP server and attach socket.io ---
const server = http.createServer(app);

// ⚙️ Prevent idle HTTP sockets piling up (match LB ~60s)
server.keepAliveTimeout = 65_000;
server.headersTimeout   = 66_000;

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(",") || "*",
    methods: ["GET", "POST"],
  },
});

// --- Socket.IO Auth Middleware ---
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Unauthorized"));

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback-secret"
    );
    socket.user = decoded;
    next();
  } catch (err) {
    console.error("Socket auth failed:", err.message);
    return next(new Error("Unauthorized"));
  }
});

// --- Handle Connection ---
io.on("connection", (socket) => {
  socket.emit("welcome", { message: `Hello ${socket.user?.name || "User"}` });
  socket.on("disconnect", () => {});
});

// Protected Route (Requires Authentication)
app.get("/api/protected", authenticate, (req, res) => {
  res.json({ message: "Secure data", user: req.user });
});

// Start Server
const PORT = process.env.PORT || 4000;
const HOST = "0.0.0.0";

// 🛡️ Guard against double listen in dev/hot-reload
if (!server.listening) {
  server.listen(PORT, HOST, () =>
    console.log(`🚀 Server running on port ${PORT}`)
  );
}

export { io };

// ✅ Clean shutdowns so DB conns don’t linger
process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  try { await prisma.$disconnect(); } finally { process.exit(0); }
});

process.on("SIGTERM", async () => {
  console.log("Process terminated...");
  try { await prisma.$disconnect(); } finally { process.exit(0); }
});

// Also handle cases where Node exits without a signal
process.on("beforeExit", async () => {
  console.log("beforeExit: disconnect prisma");
  try { await prisma.$disconnect(); } catch {}
});
