import { product } from "./brand";
import type { NormalizedActivity, RunnerProfile, StreakSettings } from "./movata-types";
import { calculateStreakSummary } from "./streaks";

const MS_PER_DAY = 86_400_000;
const today = new Date();
today.setHours(12, 0, 0, 0);

const dateKey = (offsetDays: number) => new Date(today.getTime() + offsetDays * MS_PER_DAY).toISOString().slice(0, 10);
const startedAt = (offsetDays: number, hour = 6) => `${dateKey(offsetDays)}T${String(hour).padStart(2, "0")}:18:00-04:00`;
const pace = (distanceMeters: number, seconds: number) => Math.round(seconds / (distanceMeters / 1000));

const makeRun = (
  id: string,
  offsetDays: number,
  distanceMeters: number,
  movingTimeSeconds: number,
  title: string,
  options: Partial<NormalizedActivity> = {},
): NormalizedActivity => ({
  id,
  provider: options.provider ?? "strava",
  externalId: options.externalId ?? `rs-${id}`,
  title,
  activityType: options.activityType ?? "Run",
  startedAt: options.startedAt ?? startedAt(offsetDays),
  localDate: dateKey(offsetDays),
  timezone: "America/New_York",
  distanceMeters,
  movingTimeSeconds,
  elapsedTimeSeconds: options.elapsedTimeSeconds ?? movingTimeSeconds + 95,
  averagePaceSecondsPerKm: options.averagePaceSecondsPerKm ?? pace(distanceMeters, movingTimeSeconds),
  bestPaceSecondsPerKm: options.bestPaceSecondsPerKm,
  elevationGainMeters: options.elevationGainMeters ?? 38,
  averageHeartRate: options.averageHeartRate ?? 148,
  maximumHeartRate: options.maximumHeartRate ?? 171,
  calories: options.calories,
  routePolyline: options.routePolyline ?? "_p~iF~ps|U_ulLnnqC_mqNvxq`@",
  location: options.location ?? "Brooklyn, NY",
  description: options.description,
  photos: options.photos,
  gearName: options.gearName ?? "Daily Trainer",
  workoutType: options.workoutType ?? "Base",
  privacy: options.privacy ?? "public",
  isRace: options.isRace,
  isIndoor: options.isIndoor,
  includeInStreak: options.includeInStreak ?? true,
  personalRecordTypes: options.personalRecordTypes,
  highlightTypes: options.highlightTypes,
  note: options.note,
});

const currentStreakRuns = Array.from({ length: 327 }, (_, index) => {
  const offset = -326 + index;
  const distanceKm = 2.2 + ((index * 7) % 9) * 0.55;
  const isLong = index % 23 === 0;
  const meters = Math.round((isLong ? distanceKm + 6.5 : distanceKm) * 1000);
  const seconds = Math.round((meters / 1000) * (isLong ? 330 : 345 + (index % 6) * 13));
  const provider = index % 41 === 0 ? "csv" : index % 37 === 0 ? "manual" : "strava";
  const title = isLong ? "Long steady miles" : index % 9 === 0 ? "Rainy neighborhood streak run" : "Morning streak run";
  return makeRun(`current-${index}`, offset, meters, seconds, title, { provider });
});

const previousLongStreak = Array.from({ length: 365 }, (_, index) => {
  const offset = -880 + index;
  const meters = Math.round((1.8 + ((index * 5) % 7) * 0.7) * 1000);
  return makeRun(`legacy-${index}`, offset, meters, Math.round((meters / 1000) * 365), "Archive streak mile", {
    provider: index % 14 === 0 ? "garmin" : "strava",
    includeInStreak: true,
    privacy: "private",
  });
});

export const demoProfile: RunnerProfile = {
  username: "maya",
  displayName: "Maya Chen",
  coverUrl: "/assets/movata-demo-cover.png",
  location: "Brooklyn, New York",
  bio: "Everyday runner, weekend marathoner, and collector of quiet morning miles. I run for consistency first — speed follows.",
  homeTimezone: "America/New_York",
  preferredUnit: "mi",
  runningSince: "2018-04-14",
  accentColor: product.accent,
  isPublic: true,
  isDiscoverable: true,
};

export const specialRuns: NormalizedActivity[] = [
  makeRun("fast-5k", -42, 5000, 1142, "Prospect Park 5K tune-up", {
    activityType: "Race",
    isRace: true,
    location: "Prospect Park, NY",
    bestPaceSecondsPerKm: 208,
    elevationGainMeters: 22,
    personalRecordTypes: ["Fastest 5K", "Fastest average pace"],
    highlightTypes: ["best_race", "featured"],
    note: "A brave negative split after months of steady aerobic work.",
  }),
  makeRun("marathon", -188, 42195, 12_984, "Hudson River Marathon", {
    activityType: "Race",
    isRace: true,
    location: "New York, NY",
    elevationGainMeters: 164,
    personalRecordTypes: ["Marathon", "Longest distance"],
    highlightTypes: ["memorable", "featured"],
    note: "First marathon finish, paced by friends over the final bridge.",
  }),
  makeRun("trail", -28, 14820, 6_380, "Bear Mountain ridge loop", {
    activityType: "Trail Run",
    provider: "garmin",
    location: "Bear Mountain, NY",
    elevationGainMeters: 612,
    bestPaceSecondsPerKm: 315,
    highlightTypes: ["scenic", "favorite"],
    note: "Fog lifted right as the ridge opened. The kind of run that makes the week feel bigger.",
    photos: ["/assets/movata-route-texture.png"],
  }),
  makeRun("long-run", -12, 30580, 9_560, "East River sunrise progression", {
    location: "Brooklyn waterfront",
    elevationGainMeters: 88,
    highlightTypes: ["favorite", "featured"],
    note: "A calm long run with the final six miles gently faster.",
  }),
  makeRun("treadmill", -7, 6437, 2_282, "Hotel treadmill save", {
    provider: "manual",
    activityType: "Treadmill",
    isIndoor: true,
    location: "Chicago, IL",
    elevationGainMeters: 0,
    workoutType: "Travel",
    note: "Not glamorous. Absolutely counted.",
  }),
  makeRun("duplicate", -12, 30520, 9_610, "East River sunrise progression", {
    provider: "csv",
    externalId: "csv-possible-dupe-001",
    location: "Brooklyn waterfront",
    includeInStreak: false,
    note: "Possible duplicate from a CSV import, ready to merge.",
  }),
];

export const demoActivities = [...currentStreakRuns, ...previousLongStreak, ...specialRuns].sort(
  (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
);

export const streakSettings: StreakSettings = {
  minimumDistanceMeters: 1609.34,
  minimumDurationSeconds: 0,
  qualifyingActivityTypes: ["Run", "Trail Run", "Race", "Treadmill", "Workout"],
  homeTimezone: demoProfile.homeTimezone,
};

export const demoStreak = calculateStreakSummary(demoActivities, streakSettings);

export const demoTotals = {
  totalRuns: 1458,
  totalDistanceMeters: 10_872_000,
  totalTimeSeconds: 3_421_900,
  averageWeeklyMiles: 42.6,
  milesThisWeek: 38.4,
  milesThisMonth: 146.2,
  annualGoalMiles: 2200,
  annualMiles: 1874,
};

export const demoRecords = [
  { label: "1K", value: "3:28", detail: "Track ladder · May 8" },
  { label: "1 Mile", value: "5:54", detail: "Club mile · Jun 2" },
  { label: "5K", value: "19:02", detail: "Prospect Park tune-up" },
  { label: "10K", value: "40:58", detail: "Queens 10K" },
  { label: "Half", value: "1:31:44", detail: "Brooklyn Half" },
  { label: "Marathon", value: "3:36:24", detail: "Hudson River Marathon" },
];

export const demoMilestones = [
  { date: "2018", title: "First imported run", detail: "A 2.1 mile loop after work." },
  { date: "2020", title: "First 1,000 lifetime miles", detail: "Consistency became the goal." },
  { date: "2022", title: "First marathon", detail: "Finished with a negative split." },
  { date: "2023", title: "365-day streak", detail: "A year of showing up." },
  { date: "2024", title: "Fastest 5K", detail: "19:02 on a windy spring morning." },
  { date: "Today", title: `${demoStreak.currentStreakDays}-day active streak`, detail: "The current chapter is still being written." },
];

export const communityProfiles = [
  { name: "Leo", type: "New runner", streak: 14, detail: "First month of 5K training", miles: 37 },
  { name: "Maya", type: "Run-streak athlete", streak: demoStreak.currentStreakDays, detail: "Every day, no drama", miles: 6755 },
  { name: "Sam", type: "Marathon runner", streak: 62, detail: "Building toward Berlin", miles: 4820 },
  { name: "Ari", type: "Trail runner", streak: 31, detail: "Vert over pace", miles: 2990 },
  { name: "Nora", type: "Casual weekly runner", streak: 3, detail: "Three good mornings a week", miles: 894 },
];
