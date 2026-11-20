import { useEffect, useState } from "react";
import { Download, LoaderCircle, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { canvasToFile, renderShareCard, type CardFormat, type CardSpec } from "@/lib/share-card";

/** Preview, download or share a card image for a run, race or milestone. */
export const ShareCardDialog = ({ spec, onClose }: { spec: CardSpec | null; onClose: () => void }) => {
  const [format, setFormat] = useState<CardFormat>("square");
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!spec) return;
    let cancelled = false;
    setPreview(null);
    void renderShareCard(spec, format).then((result) => {
      if (cancelled) return;
      setCanvas(result);
      try {
        setPreview(result.toDataURL("image/png"));
      } catch {
        setPreview(null); // a photo blocked cross-origin export; fall back below
        toast.error("That photo can't be used in a card. Try another photo.");
      }
    });
    return () => { cancelled = true; };
  }, [spec, format]);

  const fileName = spec ? `movata-${spec.slug}-${format}.png` : "movata-card.png";

  const download = async () => {
    if (!canvas) return;
    const file = await canvasToFile(canvas, fileName);
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const share = async () => {
    if (!canvas || !spec) return;
    setBusy(true);
    try {
      const file = await canvasToFile(canvas, fileName);
      const link = `https://movata.vercel.app/${spec.username}`;
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: spec.title, text: `${spec.title} · ${link}` });
      } else {
        await download();
        toast.info("Image downloaded. Your browser can't share files directly.");
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) toast.error("Couldn't share the card.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={Boolean(spec)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[94vh] overflow-y-auto rounded-[1.5rem] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share card</DialogTitle>
          <DialogDescription>Post it to Instagram, Strava or anywhere else. It links back to your Movata page.</DialogDescription>
        </DialogHeader>
        <ToggleGroup type="single" value={format} onValueChange={(value) => value && setFormat(value as CardFormat)} className="justify-start">
          <ToggleGroupItem value="square" className="rounded-full border border-stone-200 px-4 data-[state=on]:border-emerald-700 data-[state=on]:bg-emerald-50">Square</ToggleGroupItem>
          <ToggleGroupItem value="story" className="rounded-full border border-stone-200 px-4 data-[state=on]:border-emerald-700 data-[state=on]:bg-emerald-50">Story</ToggleGroupItem>
        </ToggleGroup>
        <div className="flex min-h-48 shrink-0 justify-center">
          {preview ? (
            <img src={preview} alt="Share card preview" className="h-auto max-h-[52vh] w-auto max-w-full rounded-2xl border border-stone-200" />
          ) : (
            <div className="flex h-48 w-full items-center justify-center rounded-2xl bg-stone-100"><LoaderCircle className="h-6 w-6 animate-spin text-emerald-700" /></div>
          )}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" className="rounded-full" disabled={!preview} onClick={() => void download()}><Download className="mr-2 h-4 w-4" />Download</Button>
          <Button type="button" className="rounded-full bg-emerald-700 text-white hover:bg-emerald-800" disabled={!preview || busy} onClick={() => void share()}><Share2 className="mr-2 h-4 w-4" />Share</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
