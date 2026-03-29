// src/routes/auth.js

import express from 'express';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

const {
  STRAVA_CLIENT_ID,
  STRAVA_CLIENT_SECRET,
  STRAVA_REDIRECT_URI,
} = process.env;

// Step 1: Redirect to Strava
router.get('/strava', (req, res) => {
  const url = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${STRAVA_REDIRECT_URI}&approval_prompt=auto&scope=read,activity:read_all`;

  res.redirect(url);
});

// Step 2: Callback
router.get('/strava/callback', async (req, res) => {
  const { code } = req.query;

  try {
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

    const { access_token, refresh_token, athlete } = tokenResponse.data;

    // Save user
    const user = await prisma.user.upsert({
      where: { stravaId: athlete.id.toString() },
      update: {
        accessToken: access_token,
        refreshToken: refresh_token,
      },
      create: {
        stravaId: athlete.id.toString(),
        name: `${athlete.firstname} ${athlete.lastname}`,
        accessToken: access_token,
        refreshToken: refresh_token,
      },
    });

    res.json({
      message: 'Strava login successful',
      user,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;