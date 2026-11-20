import type { NormalizedActivity, StreakSettings, StreakSummary } from "./movata-types";

const MS_PER_DAY = 86_400_000;

const toDateKey = (date: Date) => date.toISOString().slice(0, 10);

/**
 * Today's date (YYYY-MM-DD) in the runner's time zone. Using UTC here broke streaks every evening
 * in the Americas: after ~4–8 pm "today" became tomorrow, so yesterday's run no longer counted.
 */
const localTodayKey = (timeZone: string) => {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  } catch {
    const now = new Date();
    return toDateKey(new Date(now.getTime() - now.getTimezoneOffset() * 60_000));
  }
};

const addDays = (dateKey: string, amount: number) => {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return toDateKey(date);
};

export const isQualifyingRun = (
  activity: NormalizedActivity,
  settings: StreakSettings,
) => {
  if (!activity.includeInStreak) return false;
  if (!settings.qualifyingActivityTypes.includes(activity.activityType)) return false;
  if (activity.distanceMeters < settings.minimumDistanceMeters) return false;
  if (activity.movingTimeSeconds < settings.minimumDurationSeconds) return false;
  return true;
};

export const calculateStreakSummary = (
  activities: NormalizedActivity[],
  settings: StreakSettings,
  todayKey = localTodayKey(settings.homeTimezone),
): StreakSummary => {
  const qualifying = activities.filter((activity) => isQualifyingRun(activity, settings));
  const days = new Map<string, NormalizedActivity[]>();

  qualifying.forEach((activity) => {
    const existing = days.get(activity.localDate) ?? [];
    existing.push(activity);
    days.set(activity.localDate, existing);
  });

  const sortedDays = Array.from(days.keys()).sort();
  let longestStreakDays = 0;
  let longestStreakStart: string | undefined;
  let longestStreakEnd: string | undefined;
  let currentRunStart: string | undefined;
  let previous: string | undefined;
  let currentLength = 0;

  sortedDays.forEach((day) => {
    if (!previous || addDays(previous, 1) !== day) {
      currentRunStart = day;
      currentLength = 1;
    } else {
      currentLength += 1;
    }

    if (currentLength > longestStreakDays) {
      longestStreakDays = currentLength;
      longestStreakStart = currentRunStart;
      longestStreakEnd = day;
    }

    previous = day;
  });

  let currentStreakDays = 0;
  let cursor = days.has(todayKey) ? todayKey : addDays(todayKey, -1);
  while (days.has(cursor)) {
    currentStreakDays += 1;
    cursor = addDays(cursor, -1);
  }

  const currentStreakStart = currentStreakDays > 0 ? addDays(cursor, 1) : undefined;
  const currentStreakActivities = currentStreakStart
    ? qualifying.filter((activity) => activity.localDate >= currentStreakStart)
    : [];
  const currentStreakDistanceMeters = currentStreakActivities.reduce(
    (sum, activity) => sum + activity.distanceMeters,
    0,
  );

  const firstDay = sortedDays[0];
  const spanDays = firstDay
    ? Math.round((new Date(`${todayKey}T12:00:00Z`).getTime() - new Date(`${firstDay}T12:00:00Z`).getTime()) / MS_PER_DAY) + 1
    : 0;

  return {
    currentStreakDays,
    longestStreakDays,
    currentStreakStart,
    longestStreakStart,
    longestStreakEnd,
    activeRunningDays: days.size,
    restDays: Math.max(spanDays - days.size, 0),
    currentStreakRuns: currentStreakActivities.length,
    currentStreakDistanceMeters,
    currentStreakAverageDailyDistanceMeters: currentStreakDays
      ? currentStreakDistanceMeters / currentStreakDays
      : 0,
  };
};

export const buildActivityByDate = (activities: NormalizedActivity[]) => {
  const byDate = new Map<string, { distanceMeters: number; runs: number; ids: string[] }>();

  activities.forEach((activity) => {
    if (!activity.includeInStreak) return;
    const existing = byDate.get(activity.localDate) ?? { distanceMeters: 0, runs: 0, ids: [] };
    existing.distanceMeters += activity.distanceMeters;
    existing.runs += 1;
    existing.ids.push(activity.id);
    byDate.set(activity.localDate, existing);
  });

  return byDate;
};
