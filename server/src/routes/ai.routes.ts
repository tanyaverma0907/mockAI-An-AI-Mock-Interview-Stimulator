import { Router } from "express";
import { evaluateAnswer } from "../controllers/ai.controller.js";

const router = Router();

// POST /ai  ← this is what your frontend calls
router.post("/", evaluateAnswer);

export default router;