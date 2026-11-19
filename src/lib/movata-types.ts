export type Provider =
  | "strava"
  | "csv"
  | "manual"
  | "garmin"
  | "runna"
  | "apple_health"
  | "coros"
  | "nike_run_club"
  | "map_my_run";

export type ActivityType = "Run" | "Trail Run" | "Race" | "Treadmill" | "Workout";

export type HighlightType =
  | "favorite"
  | "memorable"
  | "scenic"
  | "best_race"
  | "toughest"
  | "featured";

export type PrivacySetting = "public" | "private" | "followers";

export interface NormalizedActivity {
  id: string;
  externalId?: string;
  provider: Provider;
  title: string;
  activityType: ActivityType;
  startedAt: string;
  localDate: string;
  timezone: string;
  distanceMeters: number;
  movingTimeSeconds: number;
  elapsedTimeSeconds: number;
  averagePaceSecondsPerKm?: number;
  bestPaceSecondsPerKm?: number;
  /** Strava's "1 mile" best effort in seconds; null = checked and none, undefined = not checked. */
  bestMileSeconds?: number | null;
  elevationGainMeters?: number;
  averageHeartRate?: number;
  maximumHeartRate?: number;
  calories?: number;
  routePolyline?: string;
  location?: string;
  description?: string;
  photos?: string[];
  gearName?: string;
  workoutType?: string;
  privacy: PrivacySetting;
  isRace?: boolean;
  isIndoor?: boolean;
  includeInStreak: boolean;
  personalRecordTypes?: string[];
  highlightTypes?: HighlightType[];
  note?: string;
}

export interface RunnerProfile {
  username: string;
  displayName: string;
  avatarUrl?: string;
  coverUrl?: string;
  location: string;
  bio: string;
  homeTimezone: string;
  preferredUnit: "mi" | "km";
  runningSince: string;
  accentColor: string;
  isPublic: boolean;
  isDiscoverable: boolean;
}

export interface StreakSettings {
  minimumDistanceMeters: number;
  minimumDurationSeconds: number;
  qualifyingActivityTypes: ActivityType[];
  homeTimezone: string;
}

export interface StreakSummary {
  currentStreakDays: number;
  longestStreakDays: number;
  currentStreakStart?: string;
  longestStreakStart?: string;
  longestStreakEnd?: string;
  activeRunningDays: number;
  restDays: number;
  currentStreakRuns: number;
  currentStreakDistanceMeters: number;
  currentStreakAverageDailyDistanceMeters: number;
}

export interface ProviderAdapter<TExternal = unknown> {
  provider: Provider;
  label: string;
  status: "active" | "paywalled" | "coming_soon" | "manual";
  normalizeActivity(input: TExternal): NormalizedActivity;
}
