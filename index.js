import dotenv from "dotenv";
dotenv.config({ path: process.env.NODE_ENV === "production" ? ".env.production" : ".env.local" });

import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import coursesRouter from "./routes/courses.js"; // ✅ Import router
import courseRouter from "./routes/course.js"

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

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

const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Extract Bearer token

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token); // Verify token with Firebase
    req.user = decodedToken; // Attach user data to request
    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

// Use the courses router
app.use("/api", coursesRouter);
app.use("/api", courseRouter);

app.get("/", (req, res) => {
  res.send("Backend API is running!");
});

// Protected Route (Requires Authentication)
app.get("/api/protected", verifyToken, (req, res) => {
  res.json({ message: "Secure data", user: req.user });
});

// Updated `/api/courses` Route
const courses = [
  {
    id: 1,
    name: "UPSC Course",
    description: "Comprehensive UPSC preparation course covering all subjects.",
    duration: "6 months",
    thumbnail: "https://placehold.co/600x337",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    originalPrice: 4999,
    discountedPrice: 3999,
    expiryDate: "2025-12-31",
    status: "active"
  },
  {
    id: 2,
    name: "TGPSC Course",
    description: "Detailed course for Telangana Public Service Commission exams.",
    duration: "4 months",
    thumbnail: "https://placehold.co/600x337",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    originalPrice: 3999,
    discountedPrice: 2999,
    expiryDate: "2025-11-30",
  },
  {
    id: 3,
    name: "APPSC Course",
    description: "Preparation course for Andhra Pradesh Public Service Commission exams.",
    duration: "5 months",
    thumbnail: "https://placehold.co/600x337",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    originalPrice: 4599,
    discountedPrice: 3499,
    expiryDate: "2025-10-15",
  },
];

app.get('/api/courses', (req, res) => {
  res.json(courses);
});

// Start Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
