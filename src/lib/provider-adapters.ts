import type { NormalizedActivity, ProviderAdapter } from "./movata-types";

const baseActivity = (input: Partial<NormalizedActivity>): NormalizedActivity => ({
  id: input.id ?? crypto.randomUUID(),
  provider: input.provider ?? "manual",
  title: input.title ?? "Untitled run",
  activityType: input.activityType ?? "Run",
  startedAt: input.startedAt ?? new Date().toISOString(),
  localDate: input.localDate ?? new Date().toISOString().slice(0, 10),
  timezone: input.timezone ?? "America/New_York",
  distanceMeters: input.distanceMeters ?? 0,
  movingTimeSeconds: input.movingTimeSeconds ?? 0,
  elapsedTimeSeconds: input.elapsedTimeSeconds ?? input.movingTimeSeconds ?? 0,
  privacy: input.privacy ?? "public",
  includeInStreak: input.includeInStreak ?? true,
  externalId: input.externalId,
  averagePaceSecondsPerKm: input.averagePaceSecondsPerKm,
  bestPaceSecondsPerKm: input.bestPaceSecondsPerKm,
  elevationGainMeters: input.elevationGainMeters,
  averageHeartRate: input.averageHeartRate,
  maximumHeartRate: input.maximumHeartRate,
  calories: input.calories,
  routePolyline: input.routePolyline,
  location: input.location,
  description: input.description,
  photos: input.photos,
  gearName: input.gearName,
  workoutType: input.workoutType,
  isRace: input.isRace,
  isIndoor: input.isIndoor,
  personalRecordTypes: input.personalRecordTypes,
  highlightTypes: input.highlightTypes,
  note: input.note,
});

export const stravaAdapter: ProviderAdapter<Partial<NormalizedActivity>> = {
  provider: "strava",
  label: "Strava",
  status: "paywalled",
  normalizeActivity: (input) => baseActivity({ ...input, provider: "strava" }),
};

export const csvAdapter: ProviderAdapter<Partial<NormalizedActivity>> = {
  provider: "csv",
  label: "CSV Import",
  status: "active",
  normalizeActivity: (input) => baseActivity({ ...input, provider: "csv" }),
};

export const manualAdapter: ProviderAdapter<Partial<NormalizedActivity>> = {
  provider: "manual",
  label: "Manual Entry",
  status: "manual",
  normalizeActivity: (input) => baseActivity({ ...input, provider: "manual" }),
};

export const providerCatalog = [
  { provider: "strava", label: "Strava", status: "paywalled", detail: "$3/year unlocks direct OAuth sync" },
  { provider: "csv", label: "CSV Import", status: "active", detail: "Universal fallback for every runner" },
  { provider: "manual", label: "Manual Entry", status: "manual", detail: "Add a run in under a minute" },
  { provider: "garmin", label: "Garmin", status: "coming_soon", detail: "Coming Soon — use CSV export for now" },
  { provider: "runna", label: "Runna", status: "coming_soon", detail: "Coming Soon — planned workouts stay separate" },
  { provider: "apple_health", label: "Apple Health", status: "coming_soon", detail: "Coming Soon — CSV fallback available" },
  { provider: "coros", label: "COROS", status: "coming_soon", detail: "Coming Soon — CSV fallback available" },
  { provider: "nike_run_club", label: "Nike Run Club", status: "coming_soon", detail: "Coming Soon — CSV fallback available" },
  { provider: "map_my_run", label: "MapMyRun", status: "coming_soon", detail: "Coming Soon — CSV fallback available" },
] as const;
