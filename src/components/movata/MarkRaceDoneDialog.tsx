import { useMemo } from "react";
import { Check, Flag, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDate, formatDistance, formatDuration } from "@/lib/format";
import type { NormalizedActivity } from "@/lib/movata-types";
import { matchFeatured, type FeaturedRunRow } from "@/lib/profile";
import type { RaceRow } from "@/lib/races";

const DAY_MS = 86_400_000;
const WINDOW_DAYS = 3;

interface MarkRaceDoneDialogProps {
  race: RaceRow | null;
  runs: NormalizedActivity[];
  featuredRuns: FeaturedRunRow[];
  unit: "mi" | "km";
  busy: boolean;
  onClose: () => void;
  /** Feature this synced run (opens the feature dialog prefilled from the race). */
  onFeatureRun: (run: NormalizedActivity) => void;
  /** The run is already featured: link the race to it directly. */
  onLinkFeatured: (featured: FeaturedRunRow) => void;
  /** No synced run: enter the result by hand. */
  onEnterManually: () => void;
  /** Mark done with no run attached. */
  onDoneWithoutRun: () => void;
}

/** "How did it go?" Pick the run that was the race, so the race becomes a featured run. */
export const MarkRaceDoneDialog = ({ race, runs, featuredRuns, unit, busy, onClose, onFeatureRun, onLinkFeatured, onEnterManually, onDoneWithoutRun }: MarkRaceDoneDialogProps) => {
  const candidates = useMemo(() => {
    if (!race?.race_date) return [];
    const raceDay = new Date(`${race.race_date}T12:00:00`).getTime();
    return runs
      .filter((run) => Math.abs(new Date(`${run.localDate}T12:00:00`).getTime() - raceDay) <= WINDOW_DAYS * DAY_MS)
      .sort((a, b) => b.distanceMeters - a.distanceMeters)
      .slice(0, 6);
  }, [race, runs]);


  return (
    <Dialog open={Boolean(race)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-[1.5rem] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Flag className="h-5 w-5 text-emerald-700" />How did {race?.name} go?</DialogTitle>
          <DialogDescription>Enter your result, or pick the run that was the race to feature it. Your Strava runs are listed for you only; you'll type what gets published.</DialogDescription>
        </DialogHeader>

        {candidates.length ? (
          <ul className="space-y-2">
            {candidates.map((run) => {
              const alreadyFeatured = matchFeatured(run, featuredRuns);
              return (
                <li key={run.id} className="flex items-center gap-3 rounded-2xl border border-stone-200 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{run.title}</p>
                    <p className="text-sm text-stone-500">{formatDate(run.localDate)} · {formatDistance(run.distanceMeters, unit)} · {formatDuration(run.movingTimeSeconds)}</p>
                  </div>
                  <Button size="sm" disabled={busy} className="shrink-0 rounded-full bg-emerald-700 text-white hover:bg-emerald-800"
                    onClick={() => (alreadyFeatured ? onLinkFeatured(alreadyFeatured) : onFeatureRun(run))}>
                    {alreadyFeatured ? <><Check className="mr-1.5 h-3.5 w-3.5" />Link featured run</> : "This one"}
                  </Button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="rounded-2xl bg-stone-50 p-4 text-sm text-stone-600">
            {race?.race_date ? `No synced runs within ${WINDOW_DAYS} days of ${formatDate(race.race_date)}.` : "This race has no date, so there's no run to match."}
          </p>
        )}

        <div className="flex flex-wrap gap-2 border-t border-stone-200 pt-4">
          <Button variant="outline" className="rounded-full" disabled={busy} onClick={onEnterManually}><PenLine className="mr-2 h-4 w-4" />Enter result manually</Button>
          <Button variant="ghost" className="rounded-full" disabled={busy} onClick={onDoneWithoutRun}>Mark done without a run</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
