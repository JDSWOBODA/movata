import { useEffect, useState } from "react";
import { Globe2, LoaderCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { deleteImages } from "@/lib/images";
import { normalizeRaceUrl, RACE_STATUS_LABELS, type RaceInput, type RaceStatus } from "@/lib/races";
import { ImagePicker } from "./ImagePicker";

interface RaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: RaceInput | null;
  mode: "add" | "edit";
  username: string;
  submitting: boolean;
  onSubmit: (input: RaceInput) => void;
  /** Edit mode: remove this race (the parent confirms first). */
  onRemove?: () => void;
}

export const RaceDialog = ({ open, onOpenChange, draft, mode, username, submitting, onSubmit, onRemove }: RaceDialogProps) => {
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
  }, [open, draft]);

  const discardUploads = () => void deleteImages(uploaded.filter((path) => path !== draft?.photo_path));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    if (!name.trim()) return setError("Give the race a name.");
    if (status === "registered" && !date) return setError("Registered races need a race date.");
    const normalizedUrl = normalizeRaceUrl(url);
    if (normalizedUrl === undefined) return setError("That link doesn't look like a web address.");
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
    });
  };

  const statuses: RaceStatus[] = mode === "edit" && draft?.status === "done" ? ["registered", "bucket_list", "done"] : ["registered", "bucket_list"];

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) discardUploads(); onOpenChange(next); }}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-[1.5rem] sm:max-w-lg">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{mode === "edit" ? "Edit race" : "Add a race"}</DialogTitle>
            <DialogDescription>Races you're signed up for go on your calendar; dream races go on your bucket list.</DialogDescription>
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
              <Label htmlFor="rc-date">Race date{status === "registered" ? "" : <span className="font-normal text-stone-400"> (optional)</span>}</Label>
              <Input id="rc-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rc-distance">Distance</Label>
              <Input id="rc-distance" value={distance} maxLength={30} onChange={(event) => setDistance(event.target.value)} placeholder="100 mi, 50K, Marathon" />
            </div>
          </div>
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
            <Textarea id="rc-note" value={note} maxLength={300} rows={2} onChange={(event) => setNote(event.target.value)} placeholder={status === "registered" ? "Summer goal race" : "Lottery hopeful"} />
          </div>
          <ImagePicker kind="run" label="Photo (optional)" value={photo} onChange={setPhoto} onUploaded={(path) => setUploaded((paths) => [...paths, path])} />

          <p className="flex items-start gap-2 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-900">
            <Globe2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Shown on <span className="font-semibold">movata.vercel.app/{username}</span> when your profile is public.</span>
          </p>
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
