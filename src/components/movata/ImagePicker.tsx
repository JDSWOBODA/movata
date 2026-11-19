import { useRef, useState } from "react";
import { Crop, ImagePlus, Link2, LoaderCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSession } from "@/contexts/SessionContext";
import { publicImageUrl, uploadImage, type ImageKind } from "@/lib/images";
import { normalizeWebUrl } from "@/lib/links";
import { fetchLinkImage, fetchLinkPreview, type LinkPreview } from "@/lib/link-preview";
import { cn } from "@/lib/utils";
import { CropDialog } from "./CropDialog";

interface ImagePickerProps {
  kind: ImageKind;
  label: string;
  /** Storage path of the current image, or null. */
  value: string | null;
  onChange: (path: string | null) => void;
  /** Called with each path this picker uploaded, so the parent can clean up if the form is abandoned. */
  onUploaded?: (path: string) => void;
  /** Offer "Use image from link" for this (raw, as typed) product or race link. */
  linkUrl?: string;
  /** Receives the page's title/description when an image is pulled from the link. */
  onLinkPreview?: (preview: LinkPreview) => void;
  className?: string;
}

const frame: Record<ImageKind, string> = {
  avatar: "h-24 w-24 rounded-full",
  cover: "aspect-[3/1] w-full rounded-2xl",
  run: "aspect-[16/9] w-full rounded-2xl",
  gear: "aspect-square w-40 rounded-2xl",
};

/** Profile photo and cover are cropped to exactly the shape the public page shows. */
const cropFor: Partial<Record<ImageKind, { aspect: number; shape: "round" | "rect"; title: string }>> = {
  avatar: { aspect: 1, shape: "round", title: "Crop profile photo" },
  cover: { aspect: 3, shape: "rect", title: "Crop cover image" },
};

/** Upload, crop, pull from a link, replace or remove one image. Uploads immediately; the parent saves the path. */
export const ImagePicker = ({ kind, label, value, onChange, onUploaded, linkUrl, onLinkPreview, className }: ImagePickerProps) => {
  const { user } = useSession();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [fetchingLink, setFetchingLink] = useState(false);
  const [cropping, setCropping] = useState<File | null>(null);
  const url = publicImageUrl(value);
  const crop = cropFor[kind];
  const link = linkUrl ? normalizeWebUrl(linkUrl, 1000) : null;
  const busy = uploading || fetchingLink;

  const upload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const path = await uploadImage(user.id, kind, file);
      onUploaded?.(path);
      onChange(path);
      setCropping(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  };

  /** Crop first where the shape matters; otherwise upload as is. */
  const accept = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file (JPG, PNG or WebP).");
      return;
    }
    if (crop) setCropping(file);
    else void upload(file);
    if (input.current) input.current.value = "";
  };

  const recropCurrent = async () => {
    if (!url) return;
    setFetchingLink(true);
    try {
      const response = await fetch(url, { cache: "no-store" });
      const blob = await response.blob();
      setCropping(new File([blob], "current.webp", { type: blob.type || "image/webp" }));
    } catch {
      toast.error("Couldn't load the current image to crop.");
    } finally {
      setFetchingLink(false);
    }
  };

  const pullLinkImage = async () => {
    if (!link) return;
    setFetchingLink(true);
    try {
      const preview = await fetchLinkPreview(link);
      onLinkPreview?.(preview);
      if (!preview.image) {
        toast.info(`${preview.siteName ?? "That page"} doesn't share a preview image. Upload a photo instead.`);
        return;
      }
      accept(await fetchLinkImage(preview.image));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't get an image from that link.");
    } finally {
      setFetchingLink(false);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm font-medium">{label}</p>
      <div className={cn("flex gap-3", kind === "avatar" ? "items-center" : "flex-col")}>
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
          aria-label={url ? `Replace ${label.toLowerCase()}` : `Upload ${label.toLowerCase()}`}
          className={cn(
            "relative flex shrink-0 items-center justify-center overflow-hidden border border-dashed border-stone-300 bg-stone-50 text-stone-400 transition hover:border-emerald-700 hover:text-emerald-700",
            frame[kind],
          )}
        >
          {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="h-6 w-6" />}
          {busy ? <span className="absolute inset-0 flex items-center justify-center bg-white/70"><LoaderCircle className="h-5 w-5 animate-spin text-emerald-700" /></span> : null}
        </button>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" className="rounded-full" disabled={busy} onClick={() => input.current?.click()}>
            {url ? "Replace" : "Upload"}
          </Button>
          {link ? (
            <Button type="button" size="sm" variant="outline" className="rounded-full" disabled={busy} onClick={() => void pullLinkImage()}>
              {fetchingLink ? <LoaderCircle className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Link2 className="mr-1.5 h-3.5 w-3.5" />}Use image from link
            </Button>
          ) : null}
          {url && crop ? (
            <Button type="button" size="sm" variant="ghost" className="rounded-full" disabled={busy} onClick={() => void recropCurrent()}>
              <Crop className="mr-1.5 h-3.5 w-3.5" />Crop
            </Button>
          ) : null}
          {url ? (
            <Button type="button" size="sm" variant="ghost" className="rounded-full text-red-700 hover:bg-red-50 hover:text-red-800" disabled={busy} onClick={() => onChange(null)}>
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />Remove
            </Button>
          ) : null}
        </div>
      </div>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(event) => accept(event.target.files?.[0])} />
      {crop ? (
        <CropDialog
          file={cropping}
          aspect={crop.aspect}
          shape={crop.shape}
          title={crop.title}
          busy={uploading}
          onCancel={() => setCropping(null)}
          onCropped={(file) => void upload(file)}
        />
      ) : null}
    </div>
  );
};
