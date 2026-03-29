import axios from "axios";
import { prisma } from "./db.js";
import { computePowerTss } from "./tss.js";

const STRAVA_ACTIVITIES = "https://www.strava.com/api/v3/athlete/activities";
const PER_PAGE = 200;

/**
 * Fetches all athlete activities from Strava (paginated), keeps type "Ride" only,
 * and creates DB rows for new stravaActivityId values (skips existing).
 */
export async function syncStravaActivitiesForUser(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const err = new Error("user_not_found");
    err.status = 404;
    throw err;
  }

  let page = 1;
  let created = 0;
  let skippedDuplicate = 0;
  let rideActivitiesSeen = 0;
  let pagesFetched = 0;

  while (true) {
    const res = await axios.get(STRAVA_ACTIVITIES, {
      params: { page, per_page: PER_PAGE },
      headers: { Authorization: `Bearer ${user.accessToken}` },
      validateStatus: () => true,
    });

    if (res.status === 401) {
      const err = new Error(
        "Strava rejected the access token. Re-authenticate with GET /api/auth/strava."
      );
      err.status = 401;
      throw err;
    }

    if (res.status !== 200 || !Array.isArray(res.data)) {
      const err = new Error("strava_activities_fetch_failed");
      err.status = 502;
      throw err;
    }

    const batch = res.data;
    pagesFetched += 1;

    if (batch.length === 0) break;

    const rides = batch.filter((a) => a && a.type === "Ride");
    if (rides.length === 0) {
      if (batch.length < PER_PAGE) break;
      page += 1;
      continue;
    }

    const stravaIds = rides.map((a) => String(a.id));
    const existing = await prisma.activity.findMany({
      where: { stravaActivityId: { in: stravaIds } },
      select: { stravaActivityId: true },
    });
    const existingSet = new Set(existing.map((e) => e.stravaActivityId));

    const newRows = [];
    for (const act of rides) {
      const date =
        act.start_date != null ? new Date(act.start_date) : new Date(NaN);
      if (Number.isNaN(date.getTime())) {
        continue;
      }

      const stravaActivityId = String(act.id);
      if (existingSet.has(stravaActivityId)) {
        skippedDuplicate += 1;
        continue;
      }

      rideActivitiesSeen += 1;

      const duration = Number.isFinite(act.moving_time) ? act.moving_time : 0;
      const avgPower = Number.isFinite(act.average_watts)
        ? act.average_watts
        : null;
      const tss = computePowerTss(duration, avgPower, user.ftp);

      newRows.push({
        userId: user.id,
        stravaActivityId,
        name: typeof act.name === "string" && act.name.trim() ? act.name : "Ride",
        date,
        duration,
        distance: Number.isFinite(act.distance) ? act.distance : 0,
        avgPower,
        tss,
      });
      existingSet.add(stravaActivityId);
    }

    if (newRows.length > 0) {
      const result = await prisma.activity.createMany({
        data: newRows,
        skipDuplicates: true,
      });
      created += result.count;
    }

    if (batch.length < PER_PAGE) break;
    page += 1;
  }

  return {
    created,
    skippedDuplicate,
    rideActivitiesSeen,
    pagesFetched,
  };
}