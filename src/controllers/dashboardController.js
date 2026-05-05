import { prisma } from "../lib/prism.js";
import { getDashboardData } from "../services/dashboardService.js";
import { syncActivities } from "../services/syncActivities.js";
import { calculateMetrics } from "../services/calculateMetrics.js";

export const getDashboard = async (req, res) => {
    try {
        const user = req.user;
        await syncActivities(user);
        await calculateMetrics(user.id);

        const data = await getDashboardData(user.id);

        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to load dashboard" });
    }
};