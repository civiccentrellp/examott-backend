require('dotenv').config(); // Load .env file
require('dotenv').config({ path: '.env.local' }); // Load .env.local and overwrite values in .env

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

// Middleware to Verify Firebase Token
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

// Public Route (No Authentication Needed)
app.get("/api/public", (req, res) => {
  res.json({ message: "Public API works!" });
});

// Protected Route (Requires Authentication)
app.get("/api/protected", verifyToken, (req, res) => {
  res.json({ message: "Secure data", user: req.user });
});

// Example route: Fetch all courses
app.get('/api/courses', (req, res) => {
  const courses = [
    { id: 1, name: "UPSC Preparation" },
    { id: 2, name: "TGPSC Preparation" },
    { id: 3, name: "APPSC Preparation" },
    { id: 4, name: "SSC Preparation" },
    { id: 5, name: "IAS Preparation" },
    { id: 6, name: "IPS Preparation" }
  ];

  res.json(courses);
});

// Start Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
