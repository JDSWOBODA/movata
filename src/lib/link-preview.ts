import { supabase } from "@/integrations/supabase/client";

export interface LinkPreview {
  title: string | null;
  description: string | null;
  siteName: string | null;
  image: string | null;
}

const functionError = async (error: unknown, fallback: string) => {
  const context = (error as { context?: Response } | null)?.context;
  if (context) {
    try {
      const body = await context.clone().json() as { error?: string };
      if (body.error) return body.error;
    } catch {
      // not JSON
    }
  }
  return fallback;
};

/** Ask the link-preview function for a page's Open Graph title and image. */
export const fetchLinkPreview = async (url: string) => {
  const { data, error } = await supabase.functions.invoke<LinkPreview & { error?: string }>("link-preview", { body: { url } });
  if (error || !data) throw new Error(await functionError(error, "Couldn't read that link."));
  if (data.error) throw new Error(data.error);
  return data;
};

/** Identify an image from its first bytes (the function sends raw bytes without an image type). */
const sniffImageType = async (blob: Blob) => {
  const head = new Uint8Array(await blob.slice(0, 16).arrayBuffer());
  const text = String.fromCharCode(...head);
  if (head[0] === 0xff && head[1] === 0xd8) return "image/jpeg";
  if (head[0] === 0x89 && text.slice(1, 4) === "PNG") return "image/png";
  if (text.startsWith("GIF8")) return "image/gif";
  if (text.startsWith("RIFF") && text.slice(8, 12) === "WEBP") return "image/webp";
  if (text.slice(4, 8) === "ftyp" && /avif|avis/.test(text.slice(8, 12))) return "image/avif";
  return null;
};

/** Download a preview image through the function (sites rarely allow direct browser downloads). */
export const fetchLinkImage = async (imageUrl: string) => {
  const { data, error } = await supabase.functions.invoke<Blob>("link-preview", { body: { url: imageUrl, mode: "image" } });
  if (error || !(data instanceof Blob)) throw new Error(await functionError(error, "Couldn't download that image."));
  const type = await sniffImageType(data);
  if (!type) throw new Error("That link's image isn't a format we can use. Try uploading a photo instead.");
  return new File([data], `link-image.${type.split("/")[1]}`, { type });
};
