// routes/user.js
import express from "express";
import { getCurrentUser } from "../controllers/user.js";
import { authenticate } from "../middlewares/auth.ts";

const router = express.Router();

router.get("/me", authenticate, getCurrentUser);

export default router;
