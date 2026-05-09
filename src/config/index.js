const isProd = process.env.NODE_ENV === "production";

const defaultClientUrl = "http://localhost:5173";

const normalizeOrigin = (value) => {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    return url.origin;
  } catch {
    return null;
  }
};

const allowedOrigins = (process.env.CLIENT_URL || defaultClientUrl)
  .split(",")
  .map(normalizeOrigin)
  .filter(Boolean);

const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  path: "/",
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

export const config = {
  env: process.env.NODE_ENV || "development",
  isProd,
  clientUrl: allowedOrigins[0] || defaultClientUrl,
  allowedOrigins,
  cookie: {
    ...cookieOptions,
  },
  oauth: {
    stateCookieName: "strava_oauth_state",
    stateMaxAgeMs: 10 * 60 * 1000,
  },
  feature: {
    enableStravaSync: process.env.ENABLE_STRAVA_SYNC === "true",
    enableDebuglogs: process.env.ENABLE_DEBUG_LOGS === "true",
  },
};
