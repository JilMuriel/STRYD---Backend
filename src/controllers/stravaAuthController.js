import axios from "axios";
import { prisma } from "../services/db.js";

const STRAVA_AUTH = "https://www.strava.com/oauth/authorize";
const STRAVA_TOKEN = "https://www.strava.com/oauth/token";
const STRAVA_ATHLETE = "https://www.strava.com/api/v3/athlete";

/**
 * Builds a short, safe message from Strava token error JSON (no raw body leak).
 */
function stravaTokenErrorMessage(data) {
  if (!data || typeof data !== "object") {
    return "Token exchange was rejected.";
  }
  if (typeof data.message === "string" && data.message.trim()) {
    return data.message.trim();
  }
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    const first = data.errors[0];
    if (first && typeof first === "object") {
      const parts = [first.field, first.code].filter(Boolean);
      if (parts.length) return parts.join(": ");
    }
  }
  return "Token exchange was rejected.";
}

function requireStravaEnv() {
  const { STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REDIRECT_URI } =
    process.env;
  if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET || !STRAVA_REDIRECT_URI) {
    const err = new Error(
      "Missing STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, or STRAVA_REDIRECT_URI"
    );
    err.status = 500;
    throw err;
  }
  return {
    clientId: STRAVA_CLIENT_ID,
    clientSecret: STRAVA_CLIENT_SECRET,
    redirectUri: STRAVA_REDIRECT_URI,
  };
}

export function redirectToStrava(req, res, next) {
  try {
    const { clientId, redirectUri } = requireStravaEnv();
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      approval_prompt: "auto",
      scope: "read",
    });
    res.redirect(302, `${STRAVA_AUTH}?${params.toString()}`);
  } catch (e) {
    next(e);
  }
}

export async function stravaCallback(req, res, next) {
  try {
    const { code, error, error_description: errorDescription } = req.query;

    if (error) {
      const errorCode = String(error);
      const message = errorDescription
        ? String(errorDescription)
        : errorCode === "access_denied"
          ? "User denied Strava authorization."
          : "Strava returned an OAuth error.";
      return res.status(400).json({ error: errorCode, message });
    }

    if (!code || typeof code !== "string") {
      return res.status(400).json({
        error: "invalid_request",
        message: "Authorization code is missing or invalid.",
      });
    }

    const { clientId, clientSecret, redirectUri } = requireStravaEnv();

    const tokenBody = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    });

    const tokenRes = await axios.post(STRAVA_TOKEN, tokenBody, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      validateStatus: () => true,
    });

    const tokenData = tokenRes.data;
    if (tokenRes.status !== 200 || !tokenData?.access_token) {
      return res.status(400).json({
        error: "token_exchange_failed",
        message: stravaTokenErrorMessage(tokenData),
      });
    }

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    if (typeof refreshToken !== "string" || !refreshToken.trim()) {
      return res.status(502).json({
        error: "missing_refresh_token",
        message:
          "Strava did not return a refresh token. Try revoking app access in Strava settings and signing in again.",
      });
    }

    const athleteRes = await axios.get(STRAVA_ATHLETE, {
      headers: { Authorization: `Bearer ${accessToken}` },
      validateStatus: () => true,
    });

    const athlete = athleteRes.data;
    if (athleteRes.status !== 200 || typeof athlete?.id !== "number") {
      return res.status(502).json({
        error: "athlete_fetch_failed",
        message: "Could not load Strava athlete profile.",
      });
    }

    const stravaId = String(athlete.id);
    const name =
      `${athlete.firstname || ""} ${athlete.lastname || ""}`.trim() ||
      "Strava user";

    const user = await prisma.user.upsert({
      where: { stravaId },
      create: {
        stravaId,
        name,
        accessToken,
        refreshToken,
      },
      update: {
        name,
        accessToken,
        refreshToken,
      },
    });

    return res.json({
      id: user.id,
      stravaId: user.stravaId,
      name: user.name,
      ftp: user.ftp,
      createdAt: user.createdAt,
    });
  } catch (e) {
    next(e);
  }
}
