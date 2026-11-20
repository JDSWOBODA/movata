import { supabase } from "@/integrations/supabase/client";
import type { HighlightType, NormalizedActivity } from "./movata-types";
import { publicImageUrl } from "./images";
import { formatDate, formatDistance, formatDuration } from "./format";

export interface ProfileRow {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  location: string;
  running_since: string | null;
  preferred_unit: "mi" | "km";
  is_public: boolean;
  avatar_path: string | null;
  cover_path: string | null;
}

export type ProfileInput = Omit<ProfileRow, "id">;

export interface FeaturedRunRow {
  id: string;
  user_id: string;
  title: string;
  run_date: string;
  distance_meters: number;
  moving_time_seconds: number;
  note: string;
  highlight_type: HighlightType;
  /** "strava" only on legacy rows prefilled from Strava; new rows are always typed by the runner. */
  source: "manual" | "strava";
  /** Always null now (Strava IDs aren't retained). Kept for the legacy column. */
  strava_activity_id: number | null;
  photo_path: string | null;
  position: number;
  /** Legacy Strava-prefilled row: hidden from visitors until the runner reviews and saves it. */
  needs_review: boolean;
}

export type FeaturedRunInput = Omit<FeaturedRunRow, "id" | "user_id" | "position">;

export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9_-]{2,29}$/;

/** Paths the app already uses, so they can't be taken as usernames. */
const RESERVED_USERNAMES = new Set(["login", "onboarding", "dashboard", "admin", "settings", "api", "assets", "public", "help", "about", "privacy", "terms", "legal"]);

export const usernameProblem = (username: string) => {
  if (!USERNAME_PATTERN.test(username)) return "Use 3–30 lowercase letters, numbers, - or _, starting with a letter or number.";
  if (RESERVED_USERNAMES.has(username)) return "That name is reserved.";
  return null;
};

export const HIGHLIGHT_LABELS: Record<HighlightType, string> = {
  featured: "Featured",
  favorite: "Favorite",
  memorable: "Memorable",
  scenic: "Scenic",
  best_race: "Best race",
  toughest: "Toughest",
};

const PROFILE_COLUMNS = "id,username,display_name,bio,location,running_since,preferred_unit,is_public,avatar_path,cover_path";
const FEATURED_COLUMNS = "id,user_id,title,run_date,distance_meters,moving_time_seconds,note,highlight_type,source,strava_activity_id,photo_path,position,needs_review";

export const fetchOwnProfile = async (userId: string) => {
  const { data, error } = await supabase.from("profiles").select(PROFILE_COLUMNS).eq("id", userId).maybeSingle();
  if (error) throw error;
  return (data ?? null) as ProfileRow | null;
};

export const fetchProfileByUsername = async (username: string) => {
  const { data, error } = await supabase.from("profiles").select(PROFILE_COLUMNS).eq("username", username.toLowerCase()).maybeSingle();
  if (error) throw error;
  return (data ?? null) as ProfileRow | null;
};

export const saveProfile = async (userId: string, input: ProfileInput) => {
  const { data, error } = await supabase
    .from("profiles")
    .upsert({ id: userId, ...input, updated_at: new Date().toISOString() })
    .select(PROFILE_COLUMNS)
    .single();
  if (error) {
    if (error.code === "23505") throw new Error(`movata.vercel.app/${input.username} is already taken.`);
    throw error;
  }
  return data as ProfileRow;
};

export const fetchFeaturedRuns = async (userId: string) => {
  const { data, error } = await supabase
    .from("featured_runs")
    .select(FEATURED_COLUMNS)
    .eq("user_id", userId)
    .order("position", { ascending: true })
    .order("run_date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({ ...row, distance_meters: Number(row.distance_meters) })) as FeaturedRunRow[];
};

export const addFeaturedRun = async (userId: string, input: FeaturedRunInput, position: number) => {
  const { data, error } = await supabase.from("featured_runs").insert({ user_id: userId, position, ...input }).select("id").single();
  if (error) {
    if (error.code === "23505") throw new Error("That run is already featured.");
    throw error;
  }
  return data.id as string;
};

export const updateFeaturedRun = async (id: string, input: Partial<FeaturedRunInput & { position: number }>) => {
  const { error } = await supabase.from("featured_runs").update({ ...input, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
};

export const removeFeaturedRun = async (id: string) => {
  const { error } = await supabase.from("featured_runs").delete().eq("id", id);
  if (error) throw error;
};

/** Shape a featured run for RunCard. */
export const featuredRunToActivity = (run: FeaturedRunRow): NormalizedActivity => ({
  id: run.id,
  // Featured runs are the runner's own entries, never Strava data, so no Strava link or attribution.
  provider: "manual",
  externalId: undefined,
  title: run.title,
  activityType: "Run",
  startedAt: `${run.run_date}T12:00:00`,
  localDate: run.run_date,
  timezone: "UTC",
  distanceMeters: run.distance_meters,
  movingTimeSeconds: run.moving_time_seconds,
  elapsedTimeSeconds: run.moving_time_seconds,
  averagePaceSecondsPerKm: Math.round(run.moving_time_seconds / (run.distance_meters / 1000)),
  privacy: "public",
  includeInStreak: false,
  highlightTypes: [run.highlight_type],
  note: run.note || undefined,
  photos: run.photo_path ? [publicImageUrl(run.photo_path)!] : undefined,
});

/** A Strava run shown privately beside an empty form, so the runner can type what to publish. */
export interface PrivateReference {
  heading: string;
  lines: string[];
  url?: string;
}

export const stravaReference = (activity: NormalizedActivity, unit: "mi" | "km"): PrivateReference => ({
  heading: activity.title,
  lines: [
    `${formatDate(activity.localDate)} · ${formatDistance(activity.distanceMeters, unit, 2)} · ${formatDuration(activity.movingTimeSeconds)}`,
  ],
  url: activity.provider === "strava" && activity.externalId ? `https://www.strava.com/activities/${activity.externalId}` : undefined,
});

/**
 * Has the runner already featured this run? Matched on what they typed (same date, distance within
 * 3%), so no Strava IDs need to be stored.
 */
export const matchFeatured = (activity: NormalizedActivity, featured: FeaturedRunRow[]) =>
  featured.find((run) => run.run_date === activity.localDate && Math.abs(run.distance_meters - activity.distanceMeters) <= activity.distanceMeters * 0.03);

/** Empty form for a manually entered featured run. */
export const blankDraft = (): FeaturedRunInput => ({
  title: "",
  run_date: new Date().toISOString().slice(0, 10),
  distance_meters: 0,
  moving_time_seconds: 0,
  note: "",
  highlight_type: "featured",
  source: "manual",
  strava_activity_id: null,
  photo_path: null,
  needs_review: false,
});
