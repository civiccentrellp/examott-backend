import dotenv from "dotenv";
dotenv.config({ path: process.env.NODE_ENV === "production" ? ".env.production" : ".env.local" });

import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import coursesRouter from "./routes/courses.js";
import authRoutes from "./routes/auth.js"
import userRoutes from "./routes/user.js"
import { authenticate } from "./middlewares/auth.js";


// Initialize Firebase Admin SDK
// admin.initializeApp({
//   credential: admin.credential.applicationDefault(),
// });

// Express app setup
const app = express();

// ✅ CORS Setup
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3000"],
  credentials: true,
  methods: "GET, POST, PUT, DELETE, OPTIONS",
  allowedHeaders: "Content-Type, Authorization",
};

// Middleware to Enable JSON parsing and Verify Firebase Token
app.use(cors(corsOptions));
app.use(express.json());

// const verifyToken = async (req, res, next) => {
//   const token = req.headers.authorization?.split(" ")[1]; // Extract Bearer token

//   if (!token) {
//     return res.status(401).json({ error: "Unauthorized: No token provided" });
//   }

//   try {
//     const decodedToken = await admin.auth().verifyIdToken(token); // Verify token with Firebase
//     req.user = decodedToken; // Attach user data to request
//     next();
//   } catch (error) {
//     console.error("Token verification failed:", error);
//     return res.status(401).json({ error: "Unauthorized: Invalid token" });
//   }
// };

// Use the courses router
app.use("/api", coursesRouter);
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);


app.get("/", (req, res) => {
  res.send("Backend API is running!");
});

// Protected Route (Requires Authentication)
app.get("/api/protected", authenticate, (req, res) => {
  res.json({ message: "Secure data", user: req.user });
});


// Start Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
