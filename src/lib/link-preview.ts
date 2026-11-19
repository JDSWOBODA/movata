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

/** Download a preview image through the function (sites rarely allow direct browser downloads). */
export const fetchLinkImage = async (imageUrl: string) => {
  const { data, error } = await supabase.functions.invoke<Blob>("link-preview", { body: { url: imageUrl, mode: "image" } });
  if (error || !(data instanceof Blob)) throw new Error(await functionError(error, "Couldn't download that image."));
  const extension = data.type.split("/")[1]?.split("+")[0] || "jpg";
  return new File([data], `link-image.${extension}`, { type: data.type || "image/jpeg" });
};
