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

app.use(cors(corsOptions));
app.use(express.json());

// ✅ Use the courses router
app.use("/api", coursesRouter);
app.use("/api", courseRouter);


app.get("/", (req, res) => {
  res.send("Backend API is running!");
});

// ✅ Start Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
