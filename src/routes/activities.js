import express from 'express';
import { PrismaClient } from '@prisma/client';
import { fetchStravaActivities } from '../services/strava.js';

const router = express.Router();
const prisma = new PrismaClient();

// TEMP: hardcode user for now
router.get('/sync', async (req, res) => {
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const activities = await fetchStravaActivities(user);
    const rides = activities.filter((a) => a.type === 'Ride');

    let created = 0;

    for (const ride of rides) {
      const exists = await prisma.activity.findUnique({
        where: { stravaActivityId: ride.id.toString() },
      });

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
            tss: 0, // we'll compute next
          },
        });

        created++;
      }
    }

    res.json({
      message: 'Sync complete',
      total: rides.length,
      created,
    });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to sync activities' });
  }
});

export default router;