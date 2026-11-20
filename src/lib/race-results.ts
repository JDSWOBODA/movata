import type { RaceRow } from "./races";

/** Standard distances. PRs are tracked per distance key, never across keys. */
export const DISTANCES = [
  { key: "1mi", label: "Mile", meters: 1609.344 },
  { key: "5k", label: "5K", meters: 5000 },
  { key: "8k", label: "8K", meters: 8000 },
  { key: "10k", label: "10K", meters: 10000 },
  { key: "15k", label: "15K", meters: 15000 },
  { key: "10mi", label: "10 Mile", meters: 16093.44 },
  { key: "half", label: "Half Marathon", meters: 21097.5 },
  { key: "marathon", label: "Marathon", meters: 42195 },
  { key: "50k", label: "50K", meters: 50000 },
  { key: "50mi", label: "50 Mile", meters: 80467.2 },
  { key: "100k", label: "100K", meters: 100000 },
  { key: "100mi", label: "100 Mile", meters: 160934.4 },
  { key: "other", label: "Other distance", meters: 0 },
] as const;

export type DistanceKey = (typeof DISTANCES)[number]["key"];
export type CourseType = "road" | "trail" | "track" | "xc" | "other";

export const COURSE_LABELS: Record<CourseType, string> = {
  road: "Road",
  trail: "Trail",
  track: "Track",
  xc: "Cross country",
  other: "Other",
};

/** Quick-pick tags for "how it felt" and "how the race was". Runners can pick up to 8. */
export const RACE_TAGS = [
  "Fast course", "Hilly", "Technical", "Perfect weather", "Hot", "Cold", "Windy", "Rainy",
  "Well organized", "Great crowd", "Negative split", "Went out too fast", "Tough day", "Felt amazing",
  "First time at this distance", "Ran with friends",
] as const;

export const MAX_TAGS = 8;

export const distanceLabel = (key: string | null | undefined) => DISTANCES.find((d) => d.key === key)?.label ?? null;

/** Guess a standard distance from free text like "Half", "26.2", "10 km", "50K". */
export const guessDistanceKey = (text: string): DistanceKey | null => {
  const t = text.toLowerCase().replace(/\s+/g, "");
  if (!t) return null;
  if (/^(half|halfmarathon|13\.1(mi)?|21\.1k(m)?)$/.test(t)) return "half";
  if (/^(marathon|full|26\.2(mi)?|42\.2k(m)?)$/.test(t)) return "marathon";
  if (/^(mile|1mi(le)?)$/.test(t)) return "1mi";
  if (/^10mi(le)?s?$/.test(t)) return "10mi";
  if (/^50mi(le)?s?$/.test(t)) return "50mi";
  if (/^100mi(le)?s?$/.test(t)) return "100mi";
  const km = t.match(/^(\d+)k(m)?$/);
  if (km) {
    const key = `${km[1]}k`;
    if (DISTANCES.some((d) => d.key === key)) return key as DistanceKey;
  }
  return null;
};

/** Parse "1:23:45", "41:07", "2:58:42.4" or "3h05m" into seconds. Returns null if unreadable. */
export const parseTime = (text: string): number | null => {
  const t = text.trim().toLowerCase();
  if (!t) return null;
  const hms = t.match(/^(?:(\d+)h)?\s*(?:(\d+)m)?\s*(?:(\d+)s)?$/);
  if (hms && (hms[1] || hms[2] || hms[3])) {
    const total = Number(hms[1] ?? 0) * 3600 + Number(hms[2] ?? 0) * 60 + Number(hms[3] ?? 0);
    return total > 0 ? total : null;
  }
  const parts = t.split(":");
  if (parts.length < 2 || parts.length > 3) return null;
  const nums = parts.map((p, i) => (i === parts.length - 1 ? Number.parseFloat(p) : Number.parseInt(p, 10)));
  if (nums.some((n) => !Number.isFinite(n) || n < 0)) return null;
  if (nums.slice(1).some((n) => n >= 60)) return null;
  const [h, m, s] = parts.length === 3 ? nums : [0, ...nums];
  const total = Math.round(h * 3600 + m * 60 + s);
  return total > 0 && total < 1_000_000 ? total : null;
};

/** 2:58:42, 41:07, 5:12 */
export const formatRaceTime = (seconds: number | null | undefined) => {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
};

/** "+1:12 over goal" / "0:48 under goal" / "Right on goal" */
export const goalGapLabel = (finish: number, goal: number) => {
  const diff = finish - goal;
  if (diff === 0) return "Right on goal";
  return `${formatRaceTime(Math.abs(diff))} ${diff > 0 ? "over" : "under"} goal`;
};

export const raceDate = (race: Pick<RaceRow, "completed_on" | "race_date">) => race.completed_on ?? race.race_date ?? "";

/** A finished, timed race at a standard distance that can count toward a PR. */
const countsForPr = (race: RaceRow) =>
  race.status === "done" &&
  !race.dnf &&
  Boolean(race.finish_seconds) &&
  Boolean(race.distance_key) &&
  race.distance_key !== "other" &&
  // Trail and cross-country courses vary too much to compare times across races.
  (race.course_type === "road" || race.course_type === "track");

export const isPrEligible = countsForPr;

export interface PersonalBest {
  key: DistanceKey;
  label: string;
  race: RaceRow;
}

/** Current best time per standard distance, in distance order. */
export const personalBests = (races: RaceRow[]): PersonalBest[] => {
  const best = new Map<string, RaceRow>();
  for (const race of races) {
    if (!countsForPr(race)) continue;
    const current = best.get(race.distance_key!);
    if (!current || race.finish_seconds! < current.finish_seconds! ||
      (race.finish_seconds === current.finish_seconds && raceDate(race) < raceDate(current))) {
      best.set(race.distance_key!, race);
    }
  }
  return DISTANCES.filter((d) => best.has(d.key)).map((d) => ({ key: d.key, label: d.label, race: best.get(d.key)! }));
};

/**
 * IDs of races that were a PR when they were run: faster than every earlier result at that
 * distance. This is the "PB marker" on the results timeline.
 */
export const prAtTheTime = (races: RaceRow[]): Set<string> => {
  const ids = new Set<string>();
  const fastest = new Map<string, number>();
  const chronological = races.filter(countsForPr).sort((a, b) => raceDate(a).localeCompare(raceDate(b)));
  for (const race of chronological) {
    const prior = fastest.get(race.distance_key!);
    if (prior === undefined || race.finish_seconds! < prior) {
      ids.add(race.id);
      fastest.set(race.distance_key!, race.finish_seconds!);
    }
  }
  return ids;
};

/** Is `candidate` faster than every other result at its distance? (Used for the "New PR!" moment.) */
export const isNewPr = (candidate: RaceRow, races: RaceRow[]) => {
  if (!countsForPr(candidate)) return false;
  return races.every((race) => race.id === candidate.id || !countsForPr(race) ||
    race.distance_key !== candidate.distance_key || race.finish_seconds! > candidate.finish_seconds!);
};

/** Finished races grouped by year, newest first. */
export const resultsByYear = (races: RaceRow[]) => {
  const done = races.filter((race) => race.status === "done").sort((a, b) => raceDate(b).localeCompare(raceDate(a)));
  const years = new Map<string, RaceRow[]>();
  for (const race of done) {
    const year = raceDate(race).slice(0, 4) || "Undated";
    years.set(year, [...(years.get(year) ?? []), race]);
  }
  return [...years.entries()].map(([year, list]) => ({ year, races: list }));
};

/** Headline for a result: "2:58:42", "DNF", or the distance when no time was entered. */
export const resultHeadline = (race: RaceRow) =>
  race.dnf ? "DNF" : race.finish_seconds ? formatRaceTime(race.finish_seconds) : raceDistanceText(race) || "Finished";

/** "Marathon", or the runner's own wording for non-standard distances. */
export const raceDistanceText = (race: Pick<RaceRow, "distance_key" | "distance_label">) =>
  race.distance_key && race.distance_key !== "other" ? distanceLabel(race.distance_key) ?? race.distance_label : race.distance_label;
