import { supabase } from "@/integrations/supabase/client";
import { normalizeWebUrl } from "./links";
import type { CourseType } from "./race-results";

export type RaceStatus = "registered" | "bucket_list" | "done";

export interface RaceRow {
  id: string;
  user_id: string;
  name: string;
  race_date: string | null;
  location: string;
  distance_label: string;
  url: string | null;
  note: string;
  status: RaceStatus;
  photo_path: string | null;
  featured_run_id: string | null;
  completed_on: string | null;
  position: number;
  /** Result fields (done races). Entered by the runner, never copied from Strava. */
  finish_seconds: number | null;
  distance_key: string | null;
  course_type: CourseType;
  dnf: boolean;
  report: string;
  tags: string[];
  /** Per-race visibility. Visitors only ever receive public races (enforced by RLS). */
  is_public: boolean;
}

export interface RaceGoalRow {
  race_id: string;
  user_id: string;
  goal_seconds: number;
  is_public: boolean;
}

/** What the race dialog edits, including the (separately stored) goal. */
export interface RaceGoalInput {
  goal_seconds: number | null;
  goal_public: boolean;
}

export type RaceInput = Pick<RaceRow,
  | "name" | "race_date" | "location" | "distance_label" | "url" | "note" | "status" | "photo_path"
  | "finish_seconds" | "distance_key" | "course_type" | "dnf" | "report" | "tags" | "is_public">;

export const RACE_STATUS_LABELS: Record<RaceStatus, string> = {
  registered: "Registered",
  bucket_list: "Bucket list",
  done: "Finished",
};

const RACE_COLUMNS = "id,user_id,name,race_date,location,distance_label,url,note,status,photo_path,featured_run_id,completed_on,position,finish_seconds,distance_key,course_type,dnf,report,tags,is_public";

export const blankRace = (status: RaceStatus = "bucket_list"): RaceInput => ({
  name: "",
  race_date: null,
  location: "",
  distance_label: "",
  url: null,
  note: "",
  status,
  photo_path: null,
  finish_seconds: null,
  distance_key: null,
  course_type: "road",
  dnf: false,
  report: "",
  tags: [],
  is_public: true,
});

/** The editable fields of an existing race, for the race dialog. */
export const raceToInput = (race: RaceRow): RaceInput => {
  const { name, race_date, location, distance_label, url, note, status, photo_path, finish_seconds, distance_key, course_type, dnf, report, tags, is_public } = race;
  return { name, race_date, location, distance_label, url, note, status, photo_path, finish_seconds, distance_key, course_type, dnf, report, tags, is_public };
};

/** Results only make sense on finished races; the database enforces this too. */
const withResultRules = <T extends Partial<RaceInput>>(input: T): T =>
  input.status && input.status !== "done" ? { ...input, finish_seconds: null, dnf: false } : input;

/** Accepts "ultrasignup.com/…" or a full URL; returns a normalized http(s) URL or null. */
export const normalizeRaceUrl = (text: string) => normalizeWebUrl(text, 500);

export const fetchRaces = async (userId: string) => {
  const { data, error } = await supabase
    .from("race_plans")
    .select(RACE_COLUMNS)
    .eq("user_id", userId)
    .order("position", { ascending: true })
    .order("race_date", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as RaceRow[];
};

export const addRace = async (userId: string, input: RaceInput & { completed_on?: string | null }, position: number) => {
  const { data, error } = await supabase
    .from("race_plans")
    .insert({ user_id: userId, position, ...withResultRules(input) })
    .select(RACE_COLUMNS)
    .single();
  if (error) throw error;
  return data as RaceRow;
};

export const updateRace = async (id: string, input: Partial<RaceInput & Pick<RaceRow, "position" | "featured_run_id" | "completed_on">>) => {
  const { error } = await supabase.from("race_plans").update({ ...withResultRules(input), updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
};

/** Goals visible to the current viewer: all of the owner's, or only public ones for visitors (RLS). */
export const fetchRaceGoals = async (userId: string) => {
  const { data, error } = await supabase.from("race_goals").select("race_id,user_id,goal_seconds,is_public").eq("user_id", userId);
  if (error) throw error;
  return new Map(((data ?? []) as RaceGoalRow[]).map((goal) => [goal.race_id, goal]));
};

/** Save or clear the goal for one race. */
export const saveRaceGoal = async (userId: string, raceId: string, goal: RaceGoalInput) => {
  if (!goal.goal_seconds) {
    const { error } = await supabase.from("race_goals").delete().eq("race_id", raceId);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from("race_goals").upsert({
    race_id: raceId,
    user_id: userId,
    goal_seconds: goal.goal_seconds,
    is_public: goal.goal_public,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
};

export const removeRace = async (id: string) => {
  const { error } = await supabase.from("race_plans").delete().eq("id", id);
  if (error) throw error;
};

const todayKey = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
};

/** Split races into the public/dashboard groups. */
export const groupRaces = (races: RaceRow[]) => {
  const today = todayKey();
  const registered = races.filter((race) => race.status === "registered").sort((a, b) => (a.race_date ?? "").localeCompare(b.race_date ?? ""));
  return {
    upcoming: registered.filter((race) => (race.race_date ?? "") >= today),
    /** Registered races whose date has passed: ask "How did it go?" */
    awaitingResult: registered.filter((race) => (race.race_date ?? "") < today),
    bucketList: races.filter((race) => race.status === "bucket_list"),
    done: races.filter((race) => race.status === "done").sort((a, b) => (b.completed_on ?? b.race_date ?? "").localeCompare(a.completed_on ?? a.race_date ?? "")),
  };
};

export const formatRaceDate = (date: string | null) =>
  date ? new Intl.DateTimeFormat(undefined, { month: "long", day: "numeric", year: "numeric" }).format(new Date(`${date}T12:00:00`)) : null;
