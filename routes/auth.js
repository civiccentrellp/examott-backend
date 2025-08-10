import express from "express";
import { signup, login , getCurrentUser  } from "../controllers/auth.js";
import { authenticate } from "../middlewares/auth.ts";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", authenticate, getCurrentUser);

export default router;