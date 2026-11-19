import { supabase } from "@/integrations/supabase/client";

export const MEDIA_BUCKET = "profile-media";

export type ImageKind = "avatar" | "cover" | "run";

/** Longest edge after resizing, per use. Keeps uploads small and fast to load. */
const MAX_EDGE: Record<ImageKind, number> = { avatar: 512, cover: 2000, run: 1600 };
const MAX_INPUT_BYTES = 25 * 1024 * 1024;

export const publicImageUrl = (path: string | null | undefined) =>
  path ? supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl : undefined;

/** Downscale (and fix phone-camera rotation) in the browser, then encode as WebP. */
const resizeImage = async (file: File, maxEdge: number) => {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser couldn't process that image.");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
  if (!blob) throw new Error("Your browser couldn't process that image.");
  return blob;
};

/** Resize and upload one image into the signed-in runner's folder. Returns its storage path. */
export const uploadImage = async (userId: string, kind: ImageKind, file: File) => {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file (JPG, PNG, WebP or HEIC).");
  if (file.size > MAX_INPUT_BYTES) throw new Error("That image is over 25 MB. Choose a smaller one.");
  let blob: Blob;
  try {
    blob = await resizeImage(file, MAX_EDGE[kind]);
  } catch (error) {
    throw new Error(error instanceof Error && error.message.includes("browser") ? error.message : "That image format isn't supported here. Try a JPG or PNG.");
  }
  const path = `${userId}/${kind}/${crypto.randomUUID()}.webp`;
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, blob, { contentType: "image/webp", cacheControl: "31536000", upsert: false });
  if (error) throw new Error(error.message || "Upload failed. Please try again.");
  return path;
};

/** Best-effort cleanup of files that are no longer referenced. */
export const deleteImages = async (paths: (string | null | undefined)[]) => {
  const unique = [...new Set(paths.filter((path): path is string => Boolean(path)))];
  if (!unique.length) return;
  const { error } = await supabase.storage.from(MEDIA_BUCKET).remove(unique);
  if (error) console.warn("Could not delete old images", error.message);
};
