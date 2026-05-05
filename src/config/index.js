const isProd = process.env.NODE_ENV === "production";

export const config = {
    env: process.env.NODE_ENV,
    clientUrl: process.env.CLIENT_URL,
    cookie: {
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
    },
    feature: {
        enableStravaSync: process.env.ENABLE_STRAVA_SYNC === "true",
        enableDebuglogs: process.env.ENABLE_DEBUG_LOGS === "true"
    }
}