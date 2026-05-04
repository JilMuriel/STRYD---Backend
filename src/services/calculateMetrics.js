import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const calculateMetrics = async (userId) => {
  const activities = await prisma.activity.findMany({
    where: { userId },
    orderBy: { date: "asc" },
  });

  let ctl = 0;
  let atl = 0;

  for (const activity of activities) {
    atl = atl + (activity.tss - atl) * (1 / 7);
    ctl = ctl + (activity.tss - ctl) * (1 / 42);

    const tsb = ctl - atl;

    await prisma.dailyMetric.upsert({
      where: {
        userId_date: {
          userId,
          date: activity.date,
        },
      },
      update: { ctl, atl, tsb },
      create: {
        userId,
        date: activity.date,
        ctl,
        atl,
        tsb,
      },
    });
  }
};