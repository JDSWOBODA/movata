import { useEffect, useState } from "react";
import { Globe2, LoaderCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LINK_KIND_LABELS, defaultLinkLabel, detectLinkKind, normalizeLinkUrl, type LinkKind, type ProfileLinkInput } from "@/lib/profile-links";

interface LinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: ProfileLinkInput | null;
  mode: "add" | "edit";
  username: string;
  submitting: boolean;
  onSubmit: (input: ProfileLinkInput) => void;
  onRemove?: () => void;
}

export const LinkDialog = ({ open, onOpenChange, draft, mode, username, submitting, onSubmit, onRemove }: LinkDialogProps) => {
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [kind, setKind] = useState<LinkKind>("link");
  const [labelTouched, setLabelTouched] = useState(false);
  const [kindTouched, setKindTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !draft) return;
    setUrl(draft.url);
    setLabel(draft.label);
    setKind(draft.kind);
    setLabelTouched(mode === "edit");
    setKindTouched(mode === "edit");
    setError(null);
  }, [open, draft, mode]);

  /** Fill in a label and type from the address until the runner edits them. */
  const onUrlChange = (text: string) => {
    setUrl(text);
    const normalized = normalizeLinkUrl(text);
    if (!normalized) return;
    if (!kindTouched) setKind(detectLinkKind(normalized));
    if (!labelTouched) setLabel(defaultLinkLabel(normalized));
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = normalizeLinkUrl(url);
    if (!normalized) return setError("Enter a web address like instagram.com/yourname.");
    if (!label.trim()) return setError("Give the link a label.");
    onSubmit({ url: normalized, label: label.trim().slice(0, 60), kind });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[1.5rem] sm:max-w-md">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{mode === "edit" ? "Edit link" : "Add a link"}</DialogTitle>
            <DialogDescription>Socials, your race vlog, coaching, a shop: anything you'd put in your bio.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="ln-url">Web address</Label>
            <Input id="ln-url" inputMode="url" autoFocus value={url} onChange={(event) => onUrlChange(event.target.value)} placeholder="instagram.com/yourname" />
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div className="space-y-2">
              <Label htmlFor="ln-label">Label</Label>
              <Input id="ln-label" value={label} maxLength={60} onChange={(event) => { setLabel(event.target.value); setLabelTouched(true); }} placeholder="Monthly race vlog" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ln-kind">Type</Label>
              <Select value={kind} onValueChange={(value) => { setKind(value as LinkKind); setKindTouched(true); }}>
                <SelectTrigger id="ln-kind" className="w-36 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{(Object.keys(LINK_KIND_LABELS) as LinkKind[]).map((value) => <SelectItem key={value} value={value}>{LINK_KIND_LABELS[value]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <p className="flex items-start gap-2 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-900">
            <Globe2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Shown on <span className="font-semibold">movata.vercel.app/{username}</span>. You'll see how many visitors click it.</span>
          </p>
          {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
          <DialogFooter className="gap-2 sm:gap-0">
            {onRemove ? (
              <Button type="button" variant="ghost" className="mr-auto rounded-full text-red-700 hover:bg-red-50 hover:text-red-800" onClick={onRemove}>
                <Trash2 className="mr-1.5 h-4 w-4" />Remove
              </Button>
            ) : null}
            <Button type="button" variant="ghost" className="rounded-full" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting} className="rounded-full bg-emerald-700 text-white hover:bg-emerald-800">
              {submitting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
              {mode === "edit" ? "Save link" : "Add link"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
