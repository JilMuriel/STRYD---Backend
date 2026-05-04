import express from 'express';
import { prisma } from '../lib/prism.js'
import { analyzeRide } from "../services/analysis.js";
import { syncActivities } from "../services/syncActivities.js";

const router = express.Router();

router.get("/sync", async (req, res) => {
  try {
    const user = await prisma.user.findFirst();

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const result = await syncActivities(user);

    res.json({
      message: "Sync complete",
      ...result,
    });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Failed to sync activities" });
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  const activity = await prisma.activity.findUnique({
    where: { id },
  });

  if (!activity) {
    return res.status(404).json({ error: "Activity not found" });
  }
  // 👇 GET METRIC FOR THAT DAY
  const metric = await prisma.dailyMetric.findFirst({
    where: {
      userId: activity.userId,
      date: {
        gte: new Date(new Date(activity.date).setHours(0, 0, 0, 0)),
        lte: new Date(new Date(activity.date).setHours(23, 59, 59, 999)),
      },
    },
  });
  const insight = analyzeRide(activity, 200); // use user FTP later

  res.json({
    ...activity,
    metric: metric ? {
      ctl: metric.ctl,
      atl: metric.atl,
      tsb: metric.tsb
    } : null,
    insight,
  });
});

export default router;