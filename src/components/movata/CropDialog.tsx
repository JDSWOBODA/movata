import { useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { LoaderCircle, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";

interface CropDialogProps {
  /** The picked image; null closes the dialog. */
  file: File | null;
  aspect: number;
  shape: "round" | "rect";
  title: string;
  busy: boolean;
  onCancel: () => void;
  onCropped: (file: File) => void;
}

/** Cut the selected area out of the original image at full resolution (rotation from the camera applied). */
const cropToFile = async (file: File, area: Area) => {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(area.width));
  canvas.height = Math.max(1, Math.round(area.height));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser couldn't crop that image.");
  context.drawImage(bitmap, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Your browser couldn't crop that image.");
  return new File([blob], "cropped.png", { type: "image/png" });
};

/** Drag to position and zoom; the result keeps the exact aspect the page displays. */
export const CropDialog = ({ file, aspect, shape, title, busy, onCancel, onCropped }: CropDialogProps) => {
  const [source, setSource] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setSource(url);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setArea(null);
    setError(null);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const confirm = async () => {
    if (!file || !area) return;
    setWorking(true);
    try {
      onCropped(await cropToFile(file, area));
    } catch (cropError) {
      setError(cropError instanceof Error ? cropError.message : "Couldn't crop that image.");
    } finally {
      setWorking(false);
    }
  };

  return (
    <Dialog open={Boolean(file)} onOpenChange={(open) => { if (!open) onCancel(); }}>
      <DialogContent className="rounded-[1.5rem] sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Drag to position. Use the slider or pinch to zoom.</DialogDescription>
        </DialogHeader>
        <div className="relative h-72 overflow-hidden rounded-2xl bg-stone-900 sm:h-80">
          {source ? (
            <Cropper
              image={source}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              cropShape={shape}
              showGrid={shape === "rect"}
              maxZoom={4}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_area, pixels) => setArea(pixels)}
              onMediaLoaded={() => setError(null)}
            />
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <ZoomOut className="h-4 w-4 text-stone-500" />
          <Slider value={[zoom]} min={1} max={4} step={0.05} onValueChange={([value]) => setZoom(value)} aria-label="Zoom" />
          <ZoomIn className="h-4 w-4 text-stone-500" />
        </div>
        {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="ghost" className="rounded-full" onClick={onCancel} disabled={busy || working}>Cancel</Button>
          <Button type="button" className="rounded-full bg-emerald-700 text-white hover:bg-emerald-800" disabled={!area || busy || working} onClick={() => void confirm()}>
            {busy || working ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}Use photo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
