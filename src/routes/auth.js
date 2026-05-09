// src/routes/auth.js

import express from 'express';
import axios from 'axios';
import crypto from 'crypto';
import { prisma } from '../lib/prism.js'
import { config } from '../config/index.js';
import { getAuthenticatedUser, requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

const clearUserAuthCookie = (res) => {
  res.clearCookie("userId", {
    ...config.cookie,
  });
};

const getStravaEnv = () => {
  const { STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REDIRECT_URI } = process.env;

  if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET || !STRAVA_REDIRECT_URI) {
    return null;
  }

  return { STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REDIRECT_URI };
};

// Step 1: Redirect to Strava
router.get('/strava', async (req, res) => {
  try {
    const stravaEnv = getStravaEnv();

    if (!stravaEnv) {
      console.error("❌ Missing Strava environment variables");
      return res.status(500).json({ 
        error: "Server configuration error. Please contact administrator." 
      });
    }

    const { STRAVA_CLIENT_ID, STRAVA_REDIRECT_URI } = stravaEnv;
    const state = crypto.randomBytes(16).toString("hex");

    res.cookie(config.oauth.stateCookieName, state, {
      httpOnly: true,
      secure: config.cookie.secure,
      sameSite: "lax",
      path: "/",
      maxAge: config.oauth.stateMaxAgeMs,
    });

    const url = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(STRAVA_REDIRECT_URI)}&approval_prompt=auto&scope=read,activity:read_all&state=${encodeURIComponent(state)}`;

    const userId = req.cookies.userId;

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (user) {
        console.log("✅ Existing session, redirecting to dashboard");
        return res.redirect(`${config.clientUrl}/dashboard`);
      } else {
        console.log("⚠️ Stale cookie detected, clearing");
        res.clearCookie("userId", {
          ...config.cookie,
        });
      }
    }

    console.log("➡️ Redirecting to Strava login");
    res.redirect(url);
  } catch (error) {
    console.error("❌ Error in /strava route:", error);
    res.status(500).json({ error: "Authentication initialization failed" });
  }
});

// Step 2: Callback
router.get('/strava/callback', async (req, res) => {
  console.log("🔄 CALLBACK HIT");
  const { code, error: oauthError, state } = req.query;

  try {
    // Handle OAuth errors from Strava
    if (oauthError) {
      console.error("❌ OAuth error from Strava:", oauthError);
      return res.redirect(`${config.clientUrl}/?error=access_denied`);
    }

    if (!code) {
      console.error("❌ No authorization code received");
      return res.redirect(`${config.clientUrl}/?error=no_code`);
    }

    const expectedState = req.cookies[config.oauth.stateCookieName];
    res.clearCookie(config.oauth.stateCookieName, {
      httpOnly: true,
      secure: config.cookie.secure,
      sameSite: "lax",
      path: "/",
    });

    if (!state || !expectedState || state !== expectedState) {
      console.error("❌ Invalid OAuth state");
      return res.redirect(`${config.clientUrl}/?error=invalid_state`);
    }

    const stravaEnv = getStravaEnv();
    if (!stravaEnv) {
      console.error("❌ Missing Strava credentials");
      return res.status(500).json({ error: "Server configuration error" });
    }

    const { STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET } = stravaEnv;

    // Exchange code for token
    const tokenResponse = await axios.post(
      'https://www.strava.com/oauth/token',
      {
        client_id: STRAVA_CLIENT_ID,
        client_secret: STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
      }
    );

    const { access_token, refresh_token, athlete, expires_at } = tokenResponse.data;

    if (!access_token || !refresh_token) {
      console.error("❌ Missing tokens in Strava response");
      return res.redirect(`${config.clientUrl}/?error=token_missing`);
    }

    // Save user
    const user = await prisma.user.upsert({
      where: { stravaId: athlete.id.toString() },
      update: {
        accessToken: access_token,
        refreshToken: refresh_token,
        name: `${athlete.firstname || ''} ${athlete.lastname || ''}`.trim() || 'Strava User',
      },
      create: {
        stravaId: athlete.id.toString(),
        name: `${athlete.firstname || ''} ${athlete.lastname || ''}`.trim() || 'Strava User',
        accessToken: access_token,
        refreshToken: refresh_token,
      },
    });

    console.log("✅ User authenticated:", user.id);

    // Set cookie with proper configuration for production
    res.cookie("userId", user.id, {
      ...config.cookie,
    });

    // Redirect to dashboard
    res.redirect(`${config.clientUrl}/dashboard`);
  } catch (error) {
    console.error("❌ Callback error:", error.response?.data || error.message);
    res.redirect(`${config.clientUrl}/?error=auth_failed`);
  }
});

router.get("/logout", (req, res) => {
  try {
    console.log("🚪 Logging out user");
    clearUserAuthCookie(res);
    res.redirect(`${config.clientUrl}/`);
  } catch (error) {
    console.error("❌ Logout error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
});

router.post("/logout", (req, res) => {
  try {
    console.log("🚪 Logging out user via API");
    clearUserAuthCookie(res);
    return res.status(200).json({ success: true, message: "Logged out" });
  } catch (error) {
    console.error("❌ Logout API error:", error);
    return res.status(500).json({ success: false, error: "Logout failed" });
  }
});

router.get("/me", requireAuth, getAuthenticatedUser);

export default router;
