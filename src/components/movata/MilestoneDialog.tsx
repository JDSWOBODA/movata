import { useEffect, useState } from "react";
import { Globe2, LoaderCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { deleteImages } from "@/lib/images";
import type { MilestoneInput } from "@/lib/milestones";
import { ImagePicker } from "./ImagePicker";

interface MilestoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: MilestoneInput | null;
  mode: "add" | "edit";
  username: string;
  submitting: boolean;
  onSubmit: (input: MilestoneInput) => void;
  onRemove?: () => void;
}

export const MilestoneDialog = ({ open, onOpenChange, draft, mode, username, submitting, onSubmit, onRemove }: MilestoneDialogProps) => {
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [date, setDate] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !draft) return;
    setTitle(draft.title);
    setDetail(draft.detail);
    setDate(draft.achieved_on);
    setPhoto(draft.photo_path);
    setUploaded([]);
    setError(null);
  }, [open, draft]);

  const discardUploads = () => void deleteImages(uploaded.filter((path) => path !== draft?.photo_path));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    if (!title.trim()) return setError("Give the milestone a title.");
    if (!date) return setError("Pick the date you reached it.");
    void deleteImages(uploaded.filter((path) => path !== photo));
    setUploaded(photo && uploaded.includes(photo) ? [photo] : []);
    onSubmit({ ...draft, title: title.trim().slice(0, 100), detail: detail.trim().slice(0, 300), achieved_on: date, photo_path: photo });
  };

  const suggested = mode === "add" && draft?.key;

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) discardUploads(); onOpenChange(next); }}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-[1.5rem] sm:max-w-lg">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{mode === "edit" ? "Edit milestone" : suggested ? "Add this milestone" : "Add a milestone"}</DialogTitle>
            <DialogDescription>{suggested ? "Worked out from your runs. Edit anything before publishing." : "A moment worth marking: a streak, a total, a first."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="ms-title">Title</Label>
            <Input id="ms-title" value={title} maxLength={100} onChange={(event) => setTitle(event.target.value)} placeholder="First 100-mile week" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ms-date">Date</Label>
            <Input id="ms-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ms-detail">Story <span className="font-normal text-stone-400">(optional)</span></Label>
            <Textarea id="ms-detail" value={detail} maxLength={300} rows={3} onChange={(event) => setDetail(event.target.value)} />
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
              {mode === "edit" ? "Save milestone" : "Publish to profile"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
