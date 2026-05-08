const isProd = process.env.NODE_ENV === "production";

export const config = {
    env: process.env.NODE_ENV || "development",
    clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
    cookie: {
        secure: isProd, // Only use secure cookies in production (requires HTTPS)
        sameSite: isProd ? "none" : "lax", // 'none' required for cross-site cookies in production
    },
    feature: {
        enableStravaSync: process.env.ENABLE_STRAVA_SYNC === "true",
        enableDebuglogs: process.env.ENABLE_DEBUG_LOGS === "true"
    }
}
