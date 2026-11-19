import { useRef, useState } from "react";
import { ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSession } from "@/contexts/SessionContext";
import { publicImageUrl, uploadImage, type ImageKind } from "@/lib/images";
import { cn } from "@/lib/utils";

interface ImagePickerProps {
  kind: ImageKind;
  label: string;
  /** Storage path of the current image, or null. */
  value: string | null;
  onChange: (path: string | null) => void;
  /** Called with each path this picker uploaded, so the parent can clean up if the form is abandoned. */
  onUploaded?: (path: string) => void;
  className?: string;
}

const frame: Record<ImageKind, string> = {
  avatar: "h-24 w-24 rounded-full",
  cover: "aspect-[3/1] w-full rounded-2xl",
  run: "aspect-[16/9] w-full rounded-2xl",
  gear: "aspect-square w-40 rounded-2xl",
};

/** Upload, preview, replace or remove one image. Uploads immediately; the parent saves the path. */
export const ImagePicker = ({ kind, label, value, onChange, onUploaded, className }: ImagePickerProps) => {
  const { user } = useSession();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const url = publicImageUrl(value);

  const choose = async (file: File | undefined) => {
    if (!file || !user) return;
    setUploading(true);
    try {
      const path = await uploadImage(user.id, kind, file);
      onUploaded?.(path);
      onChange(path);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm font-medium">{label}</p>
      <div className={cn("flex gap-3", kind === "avatar" ? "items-center" : "flex-col")}>
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={uploading}
          aria-label={url ? `Replace ${label.toLowerCase()}` : `Upload ${label.toLowerCase()}`}
          className={cn(
            "relative flex shrink-0 items-center justify-center overflow-hidden border border-dashed border-stone-300 bg-stone-50 text-stone-400 transition hover:border-emerald-700 hover:text-emerald-700",
            frame[kind],
          )}
        >
          {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="h-6 w-6" />}
          {uploading ? <span className="absolute inset-0 flex items-center justify-center bg-white/70"><LoaderCircle className="h-5 w-5 animate-spin text-emerald-700" /></span> : null}
        </button>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" className="rounded-full" disabled={uploading} onClick={() => input.current?.click()}>
            {url ? "Replace" : "Upload"}
          </Button>
          {url ? (
            <Button type="button" size="sm" variant="ghost" className="rounded-full text-red-700 hover:bg-red-50 hover:text-red-800" disabled={uploading} onClick={() => onChange(null)}>
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />Remove
            </Button>
          ) : null}
        </div>
      </div>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(event) => void choose(event.target.files?.[0])} />
    </div>
  );
};
