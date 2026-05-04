export const analyzeRide = (activity, ftp = 200) => {
  const { tss, avgPower } = activity;

  // Ride type
  let type = "Recovery Ride";
  if (tss >= 120) type = "Hard Effort Ride";
  else if (tss >= 70) type = "Tempo Ride";
  else if (tss >= 30) type = "Endurance Ride";

  // Fatigue
  let fatigue = "Low Fatigue";
  if (tss > 100) fatigue = "High Fatigue";
  else if (tss > 60) fatigue = "Moderate Fatigue";

  // Intensity
  let intensity = null;
  let effort = "Easy";

  if (avgPower) {
    intensity = avgPower / ftp;

    if (intensity > 1.05) effort = "Very Hard";
    else if (intensity > 0.9) effort = "Hard";
    else if (intensity > 0.75) effort = "Steady";
  }

  return {
    type,
    fatigue,
    effort,
    message: generateMessage(type, fatigue, effort),
  };
};

const generateMessage = (type, fatigue, effort) => {
  return `This was a ${type.toLowerCase()} with ${effort.toLowerCase()} intensity. It created ${fatigue.toLowerCase()} load on your body.`;
};