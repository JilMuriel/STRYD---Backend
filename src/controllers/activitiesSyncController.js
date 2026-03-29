import { syncStravaActivitiesForUser } from "../services/stravaActivitiesSync.js";

export async function getActivitiesSync(req, res, next) {
  try {
    const userId = req.query.userId;
    if (!userId || typeof userId !== "string") {
      return res.status(400).json({
        error: "invalid_request",
        message: "Query parameter userId is required (internal user id from OAuth callback).",
      });
    }

    const summary = await syncStravaActivitiesForUser(userId);
    res.json(summary);
  } catch (e) {
    next(e);
  }
}
