import { useEffect, useState } from "react";
import { Globe2, LoaderCircle, Lock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { deleteImages } from "@/lib/images";
import { normalizeRaceUrl, RACE_STATUS_LABELS, type RaceGoalInput, type RaceInput, type RaceStatus } from "@/lib/races";
import { COURSE_LABELS, DISTANCES, MAX_TAGS, RACE_TAGS, formatRaceTime, guessDistanceKey, parseTime, type CourseType } from "@/lib/race-results";
import { ImagePicker } from "./ImagePicker";

interface RaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: RaceInput | null;
  /** Existing goal for this race, if any. */
  goal?: RaceGoalInput | null;
  mode: "add" | "edit";
  username: string;
  submitting: boolean;
  onSubmit: (input: RaceInput, goal: RaceGoalInput) => void;
  /** Edit mode: remove this race (the parent confirms first). */
  onRemove?: () => void;
}

export const RaceDialog = ({ open, onOpenChange, draft, goal, mode, username, submitting, onSubmit, onRemove }: RaceDialogProps) => {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<RaceStatus>("bucket_list");
  const [date, setDate] = useState("");
  const [distance, setDistance] = useState("");
  const [location, setLocation] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  // Result + goal
  const [finish, setFinish] = useState("");
  const [distanceKey, setDistanceKey] = useState<string>("");
  const [course, setCourse] = useState<CourseType>("road");
  const [dnf, setDnf] = useState(false);
  const [report, setReport] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [goalTime, setGoalTime] = useState("");
  const [goalPublic, setGoalPublic] = useState(false);

  useEffect(() => {
    if (!open || !draft) return;
    setName(draft.name);
    setStatus(draft.status);
    setDate(draft.race_date ?? "");
    setDistance(draft.distance_label);
    setLocation(draft.location);
    setUrl(draft.url ?? "");
    setNote(draft.note);
    setPhoto(draft.photo_path);
    setUploaded([]);
    setError(null);
    setFinish(formatRaceTime(draft.finish_seconds));
    setDistanceKey(draft.distance_key ?? guessDistanceKey(draft.distance_label) ?? "");
    setCourse(draft.course_type);
    setDnf(draft.dnf);
    setReport(draft.report);
    setTags(draft.tags);
    setIsPublic(draft.is_public);
    setGoalTime(formatRaceTime(goal?.goal_seconds));
    setGoalPublic(goal?.goal_public ?? false);
  }, [open, draft, goal]);

  const toggleTag = (tag: string) =>
    setTags((current) => (current.includes(tag) ? current.filter((t) => t !== tag) : current.length >= MAX_TAGS ? current : [...current, tag]));

  const discardUploads = () => void deleteImages(uploaded.filter((path) => path !== draft?.photo_path));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    if (!name.trim()) return setError("Give the race a name.");
    if (status === "registered" && !date) return setError("Registered races need a race date.");
    const normalizedUrl = normalizeRaceUrl(url);
    if (normalizedUrl === undefined) return setError("That link doesn't look like a web address.");
    const isDone = status === "done";
    const finishSeconds = isDone && !dnf && finish.trim() ? parseTime(finish) : null;
    if (isDone && !dnf && finish.trim() && !finishSeconds) return setError("Enter your finish time like 41:07 or 2:58:42.");
    if (isDone && !date) return setError("Add the race date so it lands in the right year.");
    const goalSeconds = goalTime.trim() ? parseTime(goalTime) : null;
    if (goalTime.trim() && !goalSeconds) return setError("Enter your goal time like 1:45:00.");
    void deleteImages(uploaded.filter((path) => path !== photo));
    setUploaded(photo && uploaded.includes(photo) ? [photo] : []);
    onSubmit({
      name: name.trim().slice(0, 120),
      status,
      race_date: date || null,
      distance_label: distance.trim().slice(0, 30),
      location: location.trim().slice(0, 80),
      url: normalizedUrl,
      note: note.trim().slice(0, 300),
      photo_path: photo,
      finish_seconds: finishSeconds,
      distance_key: distanceKey || null,
      course_type: course,
      dnf: isDone && dnf,
      report: isDone ? report.trim().slice(0, 4000) : "",
      tags: isDone ? tags.slice(0, MAX_TAGS) : [],
      is_public: isPublic,
    }, { goal_seconds: status === "bucket_list" ? null : goalSeconds, goal_public: goalPublic });
  };

  const statuses: RaceStatus[] = ["done", "registered", "bucket_list"];
  const isDone = status === "done";

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) discardUploads(); onOpenChange(next); }}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-[1.5rem] sm:max-w-lg">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{mode === "edit" ? "Edit race" : "Add a race"}</DialogTitle>
            <DialogDescription>Finished races build your race history and PRs. Races you're signed up for go on your calendar; dream races go on your bucket list.</DialogDescription>
          </DialogHeader>

          <ToggleGroup type="single" value={status} onValueChange={(value) => value && setStatus(value as RaceStatus)} className="justify-start">
            {statuses.map((value) => (
              <ToggleGroupItem key={value} value={value} className="rounded-full border border-stone-200 px-4 data-[state=on]:border-emerald-700 data-[state=on]:bg-emerald-50 data-[state=on]:text-emerald-900">
                {RACE_STATUS_LABELS[value]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          <div className="space-y-2">
            <Label htmlFor="rc-name">Race name</Label>
            <Input id="rc-name" value={name} maxLength={120} onChange={(event) => setName(event.target.value)} placeholder="Western States 100" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="rc-date">Race date{status !== "bucket_list" ? "" : <span className="font-normal text-stone-400"> (optional)</span>}</Label>
              <Input id="rc-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rc-distance-key">Distance</Label>
              <Select value={distanceKey || undefined} onValueChange={(value) => {
                setDistanceKey(value);
                const label = DISTANCES.find((d) => d.key === value)?.label;
                if (label && value !== "other") setDistance(label);
              }}>
                <SelectTrigger id="rc-distance-key" className="rounded-xl"><SelectValue placeholder="Choose" /></SelectTrigger>
                <SelectContent>{DISTANCES.map((d) => <SelectItem key={d.key} value={d.key}>{d.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          {distanceKey === "other" || (!distanceKey && distance) ? (
            <div className="space-y-2">
              <Label htmlFor="rc-distance">Distance as you'd say it</Label>
              <Input id="rc-distance" value={distance} maxLength={30} onChange={(event) => setDistance(event.target.value)} placeholder="25K, 12 mi, Backyard ultra" />
            </div>
          ) : null}

          {isDone ? (
            <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
              <p className="text-sm font-semibold text-emerald-900">Your result</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="rc-finish">Finish time</Label>
                  <Input id="rc-finish" value={finish} disabled={dnf} inputMode="numeric" onChange={(event) => setFinish(event.target.value)} placeholder="2:58:42" className="font-mono" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rc-course">Course</Label>
                  <Select value={course} onValueChange={(value) => setCourse(value as CourseType)}>
                    <SelectTrigger id="rc-course" className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>{(Object.keys(COURSE_LABELS) as CourseType[]).map((key) => <SelectItem key={key} value={key}>{COURSE_LABELS[key]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-stone-700">
                <Switch checked={dnf} onCheckedChange={(value) => { setDnf(value); if (value) setFinish(""); }} />
                Didn't finish (DNF)
              </label>
              {course === "trail" || course === "xc" ? (
                <p className="text-xs text-stone-500">Trail and cross-country times show in your history but don't count toward road PRs, since courses vary so much.</p>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="rc-report">How it went <span className="font-normal text-stone-400">(optional)</span></Label>
                <Textarea id="rc-report" value={report} maxLength={4000} rows={4} onChange={(event) => setReport(event.target.value)} placeholder="Went out conservative, negative split the back half…" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Tags <span className="font-normal text-stone-400">(up to {MAX_TAGS})</span></p>
                <div className="flex flex-wrap gap-1.5">
                  {RACE_TAGS.map((tag) => {
                    const on = tags.includes(tag);
                    return (
                      <button key={tag} type="button" aria-pressed={on} onClick={() => toggleTag(tag)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition ${on ? "border-emerald-700 bg-emerald-700 text-white" : "border-stone-200 bg-white text-stone-700 hover:border-emerald-300"}`}>
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}

          {status !== "bucket_list" ? (
            <div className="space-y-2">
              <Label htmlFor="rc-goal">Goal time <span className="font-normal text-stone-400">(optional)</span></Label>
              <div className="flex flex-wrap items-center gap-3">
                <Input id="rc-goal" value={goalTime} onChange={(event) => setGoalTime(event.target.value)} placeholder="3:00:00" className="w-32 font-mono" />
                <label className="flex items-center gap-2 text-sm text-stone-600">
                  <Switch checked={goalPublic} onCheckedChange={setGoalPublic} />
                  {goalPublic ? "Show my goal publicly" : <><Lock className="h-3.5 w-3.5" />Only you see your goal</>}
                </label>
              </div>
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="rc-location">Location</Label>
            <Input id="rc-location" value={location} maxLength={80} onChange={(event) => setLocation(event.target.value)} placeholder="Olympic Valley, California" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rc-url">Race website <span className="font-normal text-stone-400">(optional)</span></Label>
            <Input id="rc-url" inputMode="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="ultrasignup.com/register.aspx?did=…" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rc-note">Note <span className="font-normal text-stone-400">(optional)</span></Label>
            <Textarea id="rc-note" value={note} maxLength={300} rows={2} onChange={(event) => setNote(event.target.value)} placeholder={status === "registered" ? "Summer goal race" : status === "done" ? "Bib 1432 · age group 3rd" : "Lottery hopeful"} />
          </div>
          <ImagePicker
            kind="run"
            label="Photo (optional)"
            value={photo}
            onChange={setPhoto}
            onUploaded={(path) => setUploaded((paths) => [...paths, path])}
            linkUrl={url}
            onLinkPreview={(preview) => { if (!name.trim() && preview.title) setName(preview.title.slice(0, 120)); }}
          />

          <label className={`flex items-start gap-3 rounded-2xl p-3 text-sm ${isPublic ? "bg-emerald-50 text-emerald-900" : "bg-stone-100 text-stone-700"}`}>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} className="mt-0.5" />
            <span className="flex items-start gap-2">
              {isPublic ? <Globe2 className="mt-0.5 h-4 w-4 shrink-0" /> : <Lock className="mt-0.5 h-4 w-4 shrink-0" />}
              {isPublic
                ? <span>Shown on <span className="font-semibold">movata.vercel.app/{username}</span> when your profile is public.</span>
                : <span>Private: only you can see this race.</span>}
            </span>
          </label>
          {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}

          <DialogFooter className="gap-2 sm:gap-0">
            {onRemove ? (
              <Button type="button" variant="ghost" className="mr-auto rounded-full text-red-700 hover:bg-red-50 hover:text-red-800" onClick={onRemove}>
                <Trash2 className="mr-1.5 h-4 w-4" />Remove
              </Button>
            ) : null}
            <Button type="button" variant="ghost" className="rounded-full" onClick={() => { discardUploads(); onOpenChange(false); }}>Cancel</Button>
            <Button type="submit" disabled={submitting} className="rounded-full bg-emerald-700 text-white hover:bg-emerald-800">
              {submitting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
              {mode === "edit" ? "Save race" : "Add race"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
