/**
 * Accepts "brand.com/…" or a full URL; returns a normalized http(s) URL,
 * null for an empty field, or undefined when the text isn't a usable web address.
 */
export const normalizeWebUrl = (text: string, maxLength = 500) => {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname.includes(".")) return undefined;
    const normalized = url.toString();
    return normalized.length <= maxLength ? normalized : undefined;
  } catch {
    return undefined;
  }
};

/** "www.youtube.com" → "youtube.com", for showing where a link goes. */
export const linkHost = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};
