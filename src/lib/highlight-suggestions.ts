import type { NormalizedActivity } from "./movata-types";
import { formatDistance, formatDuration } from "./format";

export interface HighlightSuggestion {
  run: NormalizedActivity;
  kind: "longest" | "fastest_mile";
  /** Short reason shown next to the run, e.g. "Longest run · 13.1 mi". */
  reason: string;
  /** Prefilled note for the feature dialog, so the public card explains why it's featured. */
  note: string;
}

/**
 * Highlight ideas from the runner's own synced runs: their longest runs and the runs that
 * hold their fastest mile (Strava's "1 mile" best effort). Already-featured runs are skipped.
 */
export const suggestHighlights = (
  runs: NormalizedActivity[],
  isFeatured: (run: NormalizedActivity) => boolean,
  unit: "mi" | "km",
  perKind = 3,
) => {
  const open = runs.filter((run) => !isFeatured(run));
  const overallLongest = runs.reduce<NormalizedActivity | null>((best, run) => (!best || run.distanceMeters > best.distanceMeters ? run : best), null);

  const longest: HighlightSuggestion[] = [...open]
    .sort((a, b) => b.distanceMeters - a.distanceMeters)
    .slice(0, perKind)
    .map((run) => ({
      run,
      kind: "longest",
      reason: `${run.id === overallLongest?.id ? "Longest run" : "Long run"} · ${formatDistance(run.distanceMeters, unit)}`,
      note: "",
    }));

  const fastestMile: HighlightSuggestion[] = open
    .filter((run): run is NormalizedActivity & { bestMileSeconds: number } => typeof run.bestMileSeconds === "number" && run.bestMileSeconds > 0)
    .sort((a, b) => a.bestMileSeconds - b.bestMileSeconds)
    .slice(0, perKind)
    .map((run) => ({
      run,
      kind: "fastest_mile",
      reason: `Fastest mile · ${formatDuration(run.bestMileSeconds)}`,
      note: `Fastest mile: ${formatDuration(run.bestMileSeconds)}`,
    }));

  return { longest, fastestMile };
};

/** The single fastest mile across all runs, for the Records section. */
export const fastestMileRun = (runs: NormalizedActivity[]) =>
  runs.reduce<(NormalizedActivity & { bestMileSeconds: number }) | null>((best, run) => {
    if (typeof run.bestMileSeconds !== "number" || run.bestMileSeconds <= 0) return best;
    return !best || run.bestMileSeconds < best.bestMileSeconds ? (run as NormalizedActivity & { bestMileSeconds: number }) : best;
  }, null);
