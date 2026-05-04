import { PrismaClient } from "@prisma/client";
import { fetchStravaActivities } from "./strava.js";
import { refreshStravaToken } from "./refreshStravaToken.js";

const prisma = new PrismaClient();

export const syncActivities = async (user) => {
    let activities = [];

    try {
        activities = await fetchStravaActivities(user);
    } catch (error) {
        const newToken = await refreshStravaToken(user);
        activities = await fetchStravaActivities(newToken);
    }

    const rides = activities.filter(
        (a) => a.type === "Ride" || a.type === "VirtualRide"
    );

    let created = 0;

    for (const ride of rides) {
        const exists = await prisma.activity.findUnique({
            where: { stravaActivityId: ride.id.toString() },
        });

        let tss = 0;

        if (ride.average_watts) {
            tss =
                (ride.moving_time * ride.average_watts) /
                (user.ftp * 3600) *
                100;
        }

        if (!exists) {
            await prisma.activity.create({
                data: {
                    userId: user.id,
                    stravaActivityId: ride.id.toString(),
                    name: ride.name,
                    date: new Date(ride.start_date),
                    duration: ride.moving_time,
                    distance: ride.distance,
                    avgPower: ride.average_watts || null,
                    tss,
                },
            });

            created++;
        }
    }

    return {
        total: rides.length,
        created,
    };
};