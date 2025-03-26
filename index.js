// Load environment variables correctly based on environment
const dotenv = require('dotenv');
const ENVIRONMENT = process.env.NODE_ENV || 'local';

if (ENVIRONMENT === 'production') {
  dotenv.config({ path: '.env.production' });
} else {
  dotenv.config({ path: '.env.local' });
}

const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK (without serviceAccountKey.json)
admin.initializeApp({
  credential: admin.credential.applicationDefault(), // Uses environment-based credentials
});

// Express app setup
const app = express();

const corsOptions = {
    origin: ["http://localhost:3000", "https://examottcc.in"], // Allow frontend requests
    credentials: true, // Allow cookies and authorization headers
    methods: ["GET", "POST", "PUT", "DELETE"], // Allow necessary methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allow necessary headers
};
app.use(cors(corsOptions));

app.use(express.json()); // Parse JSON request bodies

// Default Route (Fix for 404)
app.get("/", (req, res) => {
  res.send("Backend API is running!");
});

// Updated `/api/courses` Route
const courses = [
  {
    id: 1,
    description: `APPSC Group - II COMPUTER PROFICIENCY TEST (CPT) 2025
                  Highlights:
                  Based on Syllabus and Standard of the exam
                  Complete coverage of the syllabus
                  Classroom/Live/Recorded Classes
                  Medium: Bilingual
                  Mode: Offline/Online
                  Total No. of Classes – 10
                  Total No. of Model test – 10
                  Live Assignments & Doubts Clarification Sessions
                  Practice Book
                  Admissions in Progress 
                  Batch Starts from 12th March 2025`,
    name: "UPSC Course",
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
