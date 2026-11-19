import { supabase } from "@/integrations/supabase/client";

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
}

export type RaceInput = Pick<RaceRow, "name" | "race_date" | "location" | "distance_label" | "url" | "note" | "status" | "photo_path">;

export const RACE_STATUS_LABELS: Record<RaceStatus, string> = {
  registered: "Registered",
  bucket_list: "Bucket list",
  done: "Done",
};

const RACE_COLUMNS = "id,user_id,name,race_date,location,distance_label,url,note,status,photo_path,featured_run_id,completed_on,position";

export const blankRace = (status: RaceStatus = "bucket_list"): RaceInput => ({
  name: "",
  race_date: null,
  location: "",
  distance_label: "",
  url: null,
  note: "",
  status,
  photo_path: null,
});

/** Accepts "ultrasignup.com/…" or a full URL; returns a normalized http(s) URL or null. */
export const normalizeRaceUrl = (text: string) => {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname.includes(".")) return undefined;
    return url.toString().slice(0, 500);
  } catch {
    return undefined;
  }
};

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

export const addRace = async (userId: string, input: RaceInput, position: number) => {
  const { error } = await supabase.from("race_plans").insert({ user_id: userId, position, ...input });
  if (error) throw error;
};

export const updateRace = async (id: string, input: Partial<RaceInput & Pick<RaceRow, "position" | "featured_run_id" | "completed_on">>) => {
  const { error } = await supabase.from("race_plans").update({ ...input, updated_at: new Date().toISOString() }).eq("id", id);
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
