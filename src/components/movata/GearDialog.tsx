import { useEffect, useState } from "react";
import { Globe2, LoaderCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { deleteImages } from "@/lib/images";
import { GEAR_CATEGORY_LABELS, type GearCategory, type GearInput } from "@/lib/gear";
import { normalizeWebUrl } from "@/lib/links";
import { ImagePicker } from "./ImagePicker";

interface GearDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: GearInput | null;
  mode: "add" | "edit";
  username: string;
  submitting: boolean;
  onSubmit: (input: GearInput) => void;
  onRemove?: () => void;
}

export const GearDialog = ({ open, onOpenChange, draft, mode, username, submitting, onSubmit, onRemove }: GearDialogProps) => {
  const [category, setCategory] = useState<GearCategory>("shoes");
  const [brand, setBrand] = useState("");
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [isAffiliate, setIsAffiliate] = useState(false);
  const [isGifted, setIsGifted] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [inRotation, setInRotation] = useState(true);
  const [photo, setPhoto] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !draft) return;
    setCategory(draft.category);
    setBrand(draft.brand);
    setName(draft.name);
    setNote(draft.note);
    setProductUrl(draft.product_url ?? "");
    setIsAffiliate(draft.is_affiliate);
    setIsGifted(draft.is_gifted);
    setVideoUrl(draft.video_url ?? "");
    setInRotation(draft.in_rotation);
    setPhoto(draft.photo_path);
    setUploaded([]);
    setError(null);
  }, [open, draft]);

  const discardUploads = () => void deleteImages(uploaded.filter((path) => path !== draft?.photo_path));
  const hasProductLink = Boolean(productUrl.trim());

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    if (!name.trim()) return setError("Add the product name, like “Speedgoat 6”.");
    const product = normalizeWebUrl(productUrl, 1000);
    if (product === undefined) return setError("The product link doesn't look like a web address.");
    const video = normalizeWebUrl(videoUrl, 500);
    if (video === undefined) return setError("The video link doesn't look like a web address.");
    void deleteImages(uploaded.filter((path) => path !== photo));
    setUploaded(photo && uploaded.includes(photo) ? [photo] : []);
    onSubmit({
      category,
      brand: brand.trim().slice(0, 60),
      name: name.trim().slice(0, 100),
      note: note.trim().slice(0, 300),
      product_url: product,
      is_affiliate: Boolean(product) && isAffiliate,
      is_gifted: isGifted,
      video_url: video,
      in_rotation: inRotation,
      photo_path: photo,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) discardUploads(); onOpenChange(next); }}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-[1.5rem] sm:max-w-lg">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{mode === "edit" ? "Edit gear" : "Add to Gear Corner"}</DialogTitle>
            <DialogDescription>Highlight the shoes, apparel and gadgets you actually run in.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="gr-category">Category</Label>
              <Select value={category} onValueChange={(value) => setCategory(value as GearCategory)}>
                <SelectTrigger id="gr-category"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(GEAR_CATEGORY_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gr-brand">Brand</Label>
              <Input id="gr-brand" value={brand} maxLength={60} onChange={(event) => setBrand(event.target.value)} placeholder="Hoka" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="gr-name">Product</Label>
            <Input id="gr-name" value={name} maxLength={100} onChange={(event) => setName(event.target.value)} placeholder="Speedgoat 6" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gr-note">Why you love it <span className="font-normal text-stone-400">(optional)</span></Label>
            <Textarea id="gr-note" value={note} maxLength={300} rows={2} onChange={(event) => setNote(event.target.value)} placeholder="My go-to for long mountain days. 400 miles and still grippy." />
          </div>

          <div className="space-y-3 rounded-2xl border border-stone-200 p-3">
            <div className="space-y-2">
              <Label htmlFor="gr-product">Product link <span className="font-normal text-stone-400">(optional)</span></Label>
              <Input id="gr-product" inputMode="url" value={productUrl} onChange={(event) => setProductUrl(event.target.value)} placeholder="hoka.com/…" />
            </div>
            <label htmlFor="gr-affiliate" className={`flex items-start gap-2 text-sm ${hasProductLink ? "" : "opacity-50"}`}>
              <Checkbox id="gr-affiliate" checked={hasProductLink && isAffiliate} disabled={!hasProductLink} onCheckedChange={(checked) => setIsAffiliate(checked === true)} className="mt-0.5" />
              <span><span className="font-medium">This is an affiliate link.</span> I may earn a commission. Visitors will see an “Affiliate link” disclosure.</span>
            </label>
            <label htmlFor="gr-gifted" className="flex items-start gap-2 text-sm">
              <Checkbox id="gr-gifted" checked={isGifted} onCheckedChange={(checked) => setIsGifted(checked === true)} className="mt-0.5" />
              <span><span className="font-medium">Gifted or sponsored.</span> I got this free or have a deal with the brand. Shown as a disclosure.</span>
            </label>
          </div>

          <ImagePicker
            kind="gear"
            label="Photo (optional)"
            value={photo}
            onChange={setPhoto}
            onUploaded={(path) => setUploaded((paths) => [...paths, path])}
            linkUrl={productUrl}
            onLinkPreview={(preview) => { if (!name.trim() && preview.title) setName(preview.title.slice(0, 100)); }}
          />

          <div className="space-y-2">
            <Label htmlFor="gr-video">Video review or feature <span className="font-normal text-stone-400">(optional)</span></Label>
            <Input id="gr-video" inputMode="url" value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder="youtube.com/watch?v=…" />
            <p className="text-xs text-stone-500">A video where you review or feature this gear. Shown as a “Watch review” button.</p>
          </div>

          <label htmlFor="gr-rotation" className="flex items-center justify-between gap-4 rounded-2xl border border-stone-200 p-3">
            <span><span className="block font-medium">In my rotation now</span><span className="block text-sm text-stone-500">Off moves it to “Past favorites”.</span></span>
            <Switch id="gr-rotation" checked={inRotation} onCheckedChange={setInRotation} />
          </label>

          <p className="flex items-start gap-2 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-900">
            <Globe2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Shown in the Gear Corner at <span className="font-semibold">movata.vercel.app/{username}</span>.</span>
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
              {mode === "edit" ? "Save gear" : "Add gear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
