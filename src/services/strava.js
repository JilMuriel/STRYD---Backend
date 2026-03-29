import axios from 'axios';

export const fetchStravaActivities = async (user) => {
  try {
    const response = await axios.get(
      'https://www.strava.com/api/v3/athlete/activities',
      {
        headers: {
          Authorization: `Bearer ${user.accessToken}`, // ✅ correct
        },
        params: {
          per_page: 50,
          page: 1,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(error.response?.data || error.message);
    throw error;
  }
};