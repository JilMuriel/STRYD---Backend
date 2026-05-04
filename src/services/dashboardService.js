import { prisma } from '../lib/prism.js'


export const getDashboardData = async (userId) => {

    const latestMetric = await prisma.dailyMetric.findFirst({
        where: { userId },
        orderBy: { date: "desc" },
    });

    const metrics = await prisma.dailyMetric.findMany({
        where: { userId },
        orderBy: { date: "asc" },
    });

    const activities = await prisma.activity.findMany({
        where: { userId },
        orderBy: { date: "desc" },
        take: 7,
    });

    return {
        metrics: {
            ctl: latestMetric?.ctl || 0,
            atl: latestMetric?.atl || 0,
            tsb: latestMetric?.tsb || 0,
        },
        chart: metrics,
        recentActivities: activities,
    };


}