import express from "express";
import { prisma } from '../lib/prism.js'
import { requireAuth } from "../middleware/authMiddleware.js";
import { syncActivities } from "../services/syncActivities.js";
import { calculateMetrics } from "../services/calculateMetrics.js";
import { getDashboard } from "../controllers/dashboardController.js";
// const { PrismaClient } = pkg;

const router = express.Router();

console.log("🔥 DASHBOARD ROUTE FILE LOADED");

router.get("/", requireAuth, getDashboard);

export default router;