import { useEffect, useState } from "react";
import { ExternalLink, Globe2, LoaderCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDuration, metersToKm, metersToMiles } from "@/lib/format";
import { HIGHLIGHT_LABELS, type FeaturedRunInput, type PrivateReference } from "@/lib/profile";
import { deleteImages } from "@/lib/images";
import { ImagePicker } from "./ImagePicker";
import type { HighlightType } from "@/lib/movata-types";

interface FeatureRunDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Starting values: an existing featured run, or blank for a new one. Never prefilled from Strava. */
  draft: FeaturedRunInput | null;
  /** The runner's own Strava run, shown only to them as something to copy from. */
  reference?: PrivateReference | null;
  mode: "add" | "edit";
  unit: "mi" | "km";
  username: string;
  submitting: boolean;
  onSubmit: (input: FeaturedRunInput) => void;
}

const today = () => new Date().toISOString().slice(0, 10);

/** "1:02:03", "42:10" or "42" (minutes) → seconds. */
const parseDuration = (text: string) => {
  const parts = text.trim().split(":").map((part) => Number(part));
  if (!parts.length || parts.some((part) => !Number.isFinite(part) || part < 0)) return null;
  if (parts.length === 1) return Math.round(parts[0] * 60);
  if (parts.length === 2) return Math.round(parts[0] * 60 + parts[1]);
  if (parts.length === 3) return Math.round(parts[0] * 3600 + parts[1] * 60 + parts[2]);
  return null;
};

export const FeatureRunDialog = ({ open, onOpenChange, draft, reference, mode, unit, username, submitting, onSubmit }: FeatureRunDialogProps) => {
  const [title, setTitle] = useState("");
  const [runDate, setRunDate] = useState(today());
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [note, setNote] = useState("");
  const [highlight, setHighlight] = useState<HighlightType>("featured");
  const [photo, setPhoto] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !draft) return;
    setTitle(draft.title);
    setRunDate(draft.run_date);
    const shown = unit === "mi" ? metersToMiles(draft.distance_meters) : metersToKm(draft.distance_meters);
    setDistance(draft.distance_meters ? String(Math.round(shown * 100) / 100) : "");
    setDuration(draft.moving_time_seconds ? formatDuration(draft.moving_time_seconds) : "");
    setNote(draft.note);
    setHighlight(draft.highlight_type);
    setPhoto(draft.photo_path);
    setUploaded([]);
    setError(null);
  }, [open, draft, unit]);

  const reviewing = mode === "edit" && draft?.needs_review;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    const distanceValue = Number(distance);
    const seconds = parseDuration(duration);
    if (!title.trim()) return setError("Give the run a title.");
    if (!runDate) return setError("Pick the date of the run.");
    if (!Number.isFinite(distanceValue) || distanceValue <= 0) return setError(`Enter a distance in ${unit}.`);
    if (!seconds) return setError("Enter a time like 45:30 or 1:05:00.");
    // Photos uploaded in this dialog but not kept are unreferenced; clean them up now.
    void deleteImages(uploaded.filter((path) => path !== photo));
    setUploaded(photo && uploaded.includes(photo) ? [photo] : []);
    onSubmit({
      ...draft,
      title: title.trim().slice(0, 120),
      run_date: runDate,
      distance_meters: Math.round(distanceValue * (unit === "mi" ? 1609.344 : 1000) * 10) / 10,
      moving_time_seconds: seconds,
      note: note.trim().slice(0, 500),
      highlight_type: highlight,
      photo_path: photo,
      // Saving means the runner has entered (or confirmed) these values themselves.
      source: "manual",
      strava_activity_id: null,
      needs_review: false,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Closing without saving: delete photos uploaded during this edit.
        if (!next) void deleteImages(uploaded.filter((path) => path !== draft?.photo_path));
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-[1.5rem] sm:max-w-lg">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{reviewing ? "Review this featured run" : mode === "edit" ? "Edit featured run" : reference ? "Feature this run" : "Add a run to feature"}</DialogTitle>
            <DialogDescription>
              {reviewing
                ? "This run was filled in from Strava, so it's hidden from visitors. Check the details and save to publish it as your own entry."
                : "Enter the details you want people to see."}
            </DialogDescription>
          </DialogHeader>

          {reference ? (
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3 text-sm">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500"><Lock className="h-3 w-3" />Your Strava run · only you see this</p>
              <p className="mt-1 font-medium text-stone-900">{reference.heading}</p>
              {reference.lines.map((line) => <p key={line} className="text-stone-600">{line}</p>)}
              {reference.url ? (
                <a href={reference.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-[#FC5200] underline underline-offset-2">
                  View on Strava<ExternalLink className="h-3 w-3" />
                </a>
              ) : null}
              <p className="mt-2 text-xs text-stone-500">Strava's rules don't let us publish Strava data for you, so type the details you want on your page.</p>
            </div>
          ) : null}

          <ImagePicker kind="run" label="Photo (optional)" value={photo} onChange={setPhoto} onUploaded={(path) => setUploaded((paths) => [...paths, path])} />

          <div className="space-y-2">
            <Label htmlFor="fr-title">Title</Label>
            <Input id="fr-title" value={title} maxLength={120} onChange={(event) => setTitle(event.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="fr-date">Date</Label>
              <Input id="fr-date" type="date" value={runDate} max={today()} onChange={(event) => setRunDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fr-type">Label</Label>
              <Select value={highlight} onValueChange={(value) => setHighlight(value as HighlightType)}>
                <SelectTrigger id="fr-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(HIGHLIGHT_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fr-distance">Distance ({unit})</Label>
              <Input id="fr-distance" inputMode="decimal" value={distance} onChange={(event) => setDistance(event.target.value)} placeholder={unit === "mi" ? "13.1" : "21.1"} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fr-duration">Time</Label>
              <Input id="fr-duration" inputMode="numeric" value={duration} onChange={(event) => setDuration(event.target.value)} placeholder="1:45:30" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fr-note">Why it matters <span className="font-normal text-stone-400">(optional)</span></Label>
            <Textarea id="fr-note" value={note} maxLength={500} rows={3} onChange={(event) => setNote(event.target.value)} placeholder="First half marathon, rain the whole way." />
          </div>

          <p className="flex items-start gap-2 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-900">
            <Globe2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Photo, title, date, distance, time and note will be public at <span className="font-semibold">movata.vercel.app/{username}</span>. Maps, heart rate and start times are never published.</span>
          </p>
          {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" className="rounded-full" onClick={() => { void deleteImages(uploaded.filter((path) => path !== draft?.photo_path)); onOpenChange(false); }}>Cancel</Button>
            <Button type="submit" disabled={submitting} className="rounded-full bg-emerald-700 text-white hover:bg-emerald-800">
              {submitting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
              {mode === "edit" ? "Save changes" : "Publish to profile"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
