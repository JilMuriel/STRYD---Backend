// src/routes/auth.js

import express from 'express';
import axios from 'axios';
import { prisma } from '../lib/prism.js'
import { config } from '../config/index.js';

const router = express.Router();

const {
  STRAVA_CLIENT_ID,
  STRAVA_CLIENT_SECRET,
  STRAVA_REDIRECT_URI,
} = process.env;

// Step 1: Redirect to Strava
router.get('/strava', async (req, res) => {
  const url = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${STRAVA_REDIRECT_URI}&approval_prompt=auto&scope=read,activity:read_all`;

  const userId = req.cookies.userId;

  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (user) {
      console.log("✅ Existing session, redirecting to dashboard");
      // return res.redirect("https://stryd-backend.onrender.com/api/dashboard");
      // return res.redirect("http://localhost:5173/dashboard");
      return res.redirect(`${config.clientUrl}/dashboard`);
    } else {
      console.log("⚠️ Stale cookie detected, clearing");
      res.clearCookie("userId");
    }
  }

  console.log("➡️ Redirecting to Strava login");
  res.redirect(url);
});

// Step 2: Callback
router.get('/strava/callback', async (req, res) => {
  console.log("CALLBACK HIT");
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

    res.cookie("userId", user.id, {
      httpOnly: true,
      secure: config.cookie.secure,
      sameSite: config.cookie.sameSite,
      path: "/"
    })
    res.redirect(`${config.clientUrl}/dashboard`);
    // res.send(`
    //   <html>
    //     <body>
    //       <script>
    //         window.location.href = "http://localhost:5173/dashboard";
    //       </script>
    //     </body>
    //   </html>
    // `);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/logout", (req, res) => {
  // Optional: clear cookies/session 
  res.clearCookie("userId");
  // res.redirect("http://localhost:5173/");
  res.redirect(`${config.clientUrl}/`);
  
});

export default router;