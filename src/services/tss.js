/**
 * Power-based Training Stress Score (no normalized power).
 * TSS = (duration_seconds * avgPower) / (ftp * 3600) * 100
 *
 * Returns null when avgPower is missing/invalid, duration is missing/zero/invalid,
 * or ftp is invalid (e.g. ftp ≤ 0). Zero duration yields null, not TSS 0.
 */
export function computePowerTss(durationSeconds, avgPower, ftp) {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return null;
  }
  if (avgPower == null || !Number.isFinite(avgPower)) {
    return null;
  }
  if (!Number.isFinite(ftp) || ftp <= 0) {
    return null;
  }
  const tss = (durationSeconds * avgPower) / (ftp * 3600) * 100;
  return Number.isFinite(tss) ? tss : null;
}
