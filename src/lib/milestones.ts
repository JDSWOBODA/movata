import { supabase } from "@/integrations/supabase/client";
import type { NormalizedActivity, StreakSummary } from "./movata-types";
import { formatDate, metersToKm, metersToMiles } from "./format";

export type MilestoneKind = "yearly_distance" | "streak" | "long_run" | "race" | "custom";

export interface MilestoneRow {
  id: string;
  user_id: string;
  key: string | null;
  kind: MilestoneKind;
  title: string;
  detail: string;
  achieved_on: string;
  photo_path: string | null;
  position: number;
}

export type MilestoneInput = Pick<MilestoneRow, "key" | "kind" | "title" | "detail" | "achieved_on" | "photo_path">;

const COLUMNS = "id,user_id,key,kind,title,detail,achieved_on,photo_path,position";

export const fetchMilestones = async (userId: string) => {
  const { data, error } = await supabase.from("milestones").select(COLUMNS).eq("user_id", userId).order("achieved_on", { ascending: false });
  if (error) throw error;
  return (data ?? []) as MilestoneRow[];
};

export const addMilestone = async (userId: string, input: MilestoneInput) => {
  const { error } = await supabase.from("milestones").insert({ user_id: userId, ...input });
  if (error) {
    if (error.code === "23505") throw new Error("That milestone is already on your page.");
    throw error;
  }
};

export const updateMilestone = async (id: string, input: Partial<MilestoneInput>) => {
  const { error } = await supabase.from("milestones").update({ ...input, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
};

export const removeMilestone = async (id: string) => {
  const { error } = await supabase.from("milestones").delete().eq("id", id);
  if (error) throw error;
};

export const fetchDismissedMilestones = async (userId: string) => {
  const { data, error } = await supabase.from("milestone_dismissals").select("key").eq("user_id", userId);
  if (error) throw error;
  return new Set((data ?? []).map((row) => row.key as string));
};

export const dismissMilestone = async (userId: string, key: string) => {
  const { error } = await supabase.from("milestone_dismissals").upsert({ user_id: userId, key }, { onConflict: "user_id,key", ignoreDuplicates: true });
  if (error) throw error;
};

export const blankMilestone = (): MilestoneInput => ({
  key: null,
  kind: "custom",
  title: "",
  detail: "",
  achieved_on: new Date().toISOString().slice(0, 10),
  photo_path: null,
});

// ---- suggestions -------------------------------------------------------------------------------

export interface MilestoneSuggestion extends MilestoneInput {
  key: string;
  /** Short reason shown on the dashboard card. */
  why: string;
}

const MILE_STEPS = [250, 500, 750, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 5000];
const KM_STEPS = [500, 1000, 1500, 2000, 3000, 4000, 5000, 6000, 8000];
const STREAK_STEPS = [30, 50, 100, 150, 200, 365, 500, 730, 1000, 1095, 1500, 1825, 2000, 2500, 3000, 3650];
const LONG_RUNS = [
  { meters: 160_934, label: "100-mile run", slug: "100mi" },
  { meters: 100_000, label: "100K", slug: "100k" },
  { meters: 80_467, label: "50-mile run", slug: "50mi" },
  { meters: 50_000, label: "50K", slug: "50k" },
  { meters: 42_195, label: "Marathon-distance run", slug: "marathon" },
];

const addDays = (date: string, days: number) => {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const fmt = (n: number) => n.toLocaleString();

/**
 * Private milestone ideas from the runner's own runs. Nothing here is published: the runner reviews,
 * edits and confirms each one. Years and streaks are only suggested when the synced history covers them.
 */
export const suggestMilestones = (
  runs: NormalizedActivity[],
  streak: StreakSummary,
  unit: "mi" | "km",
  exclude: Set<string>,
  limit = 6,
): MilestoneSuggestion[] => {
  if (!runs.length) return [];
  const sorted = [...runs].sort((a, b) => a.localDate.localeCompare(b.localDate));
  const earliest = sorted[0].localDate;
  const suggestions: MilestoneSuggestion[] = [];
  const toUnit = unit === "mi" ? metersToMiles : metersToKm;
  const steps = unit === "mi" ? MILE_STEPS : KM_STEPS;

  // 1. Yearly distance: the highest round number passed each fully covered year.
  const years = [...new Set(sorted.map((run) => run.localDate.slice(0, 4)))];
  years.forEach((year) => {
    if (earliest > `${year}-01-01`) return; // history starts mid-year: totals would be wrong
    let total = 0;
    let count = 0;
    let best: { step: number; date: string; runs: number } | undefined;
    for (const run of sorted) {
      if (!run.localDate.startsWith(year)) continue;
      total += toUnit(run.distanceMeters);
      count += 1;
      const passed = steps.filter((step) => total >= step).pop();
      if (passed && (!best || passed > best.step)) best = { step: passed, date: run.localDate, runs: count };
    }
    if (best) {
      const { step, date, runs: runCount } = best;
      suggestions.push({
        key: `year:${year}:${step}${unit}`,
        kind: "yearly_distance",
        title: `${fmt(step)} ${unit === "mi" ? "miles" : "km"} in ${year}`,
        detail: `Passed ${fmt(step)} ${unit} on ${formatDate(date)}, ${fmt(runCount)} runs into the year.`,
        achieved_on: date,
        photo_path: null,
        why: `${year} total`,
      });
    }
  });

  // 2. Streaks: the highest round mark reached in the current and the longest streak.
  const streaks = [
    { start: streak.currentStreakStart, days: streak.currentStreakDays, label: "current" },
    { start: streak.longestStreakStart, days: streak.longestStreakDays, label: "longest" },
  ];
  streaks.forEach(({ start, days, label }) => {
    if (!start || start <= earliest) return; // the streak may have begun before the synced history
    const step = [...STREAK_STEPS].reverse().find((s) => days >= s);
    if (!step) return;
    const key = `streak:${start}:${step}`;
    if (suggestions.some((s) => s.key === key)) return;
    suggestions.push({
      key,
      kind: "streak",
      title: `${fmt(step)}-day run streak`,
      detail: `Ran every day for ${fmt(step)} days in a row, starting ${formatDate(start)}.`,
      achieved_on: addDays(start, step - 1),
      photo_path: null,
      why: `${label} streak`,
    });
  });

  // 3. Big days: the most recent run in each distance class (each run counted once, at its highest class).
  const seenClass = new Set<string>();
  [...sorted].reverse().forEach((run) => {
    const klass = LONG_RUNS.find((c) => run.distanceMeters >= c.meters * 0.98);
    if (!klass || seenClass.has(klass.slug)) return;
    seenClass.add(klass.slug);
    suggestions.push({
      key: `long:${klass.slug}:${run.externalId ?? run.id}`,
      kind: "long_run",
      title: `${klass.label}: ${run.title}`.slice(0, 100),
      detail: `${toUnit(run.distanceMeters).toFixed(1)} ${unit} on ${formatDate(run.localDate)}.`,
      achieved_on: run.localDate,
      photo_path: null,
      why: klass.label,
    });
  });

  return suggestions
    .filter((s) => !exclude.has(s.key))
    .sort((a, b) => b.achieved_on.localeCompare(a.achieved_on))
    .slice(0, limit);
};
