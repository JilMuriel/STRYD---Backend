import axios from "axios";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const refreshStravaToken = async (user) => {
  const response = await axios.post("https://www.strava.com/oauth/token", {
    client_id: process.env.STRAVA_CLIENT_ID,
    client_secret: process.env.STRAVA_CLIENT_SECRET,
    grant_type: "refresh_token",
    refresh_token: user.refreshToken,
  });

  const { access_token, refresh_token } = response.data;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      accessToken: access_token,
      refreshToken: refresh_token,
    },
  });

  return access_token;
};