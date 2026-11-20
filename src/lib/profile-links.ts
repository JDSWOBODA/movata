import { supabase } from "@/integrations/supabase/client";
import { linkHost, normalizeWebUrl } from "./links";

export type LinkKind =
  | "link" | "instagram" | "tiktok" | "youtube" | "strava" | "x" | "threads" | "facebook"
  | "podcast" | "newsletter" | "shop" | "coaching";

export interface ProfileLinkRow {
  id: string;
  user_id: string;
  label: string;
  url: string;
  kind: LinkKind;
  position: number;
}

export type ProfileLinkInput = Pick<ProfileLinkRow, "label" | "url" | "kind">;

export const MAX_LINKS = 12;

export const LINK_KIND_LABELS: Record<LinkKind, string> = {
  link: "Link",
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  strava: "Strava profile",
  x: "X",
  threads: "Threads",
  facebook: "Facebook",
  podcast: "Podcast",
  newsletter: "Newsletter",
  shop: "Shop",
  coaching: "Coaching",
};

const HOST_KINDS: [RegExp, LinkKind][] = [
  [/(^|\.)instagram\.com$/, "instagram"],
  [/(^|\.)tiktok\.com$/, "tiktok"],
  [/(^|\.)(youtube\.com|youtu\.be)$/, "youtube"],
  [/(^|\.)strava\.com$/, "strava"],
  [/(^|\.)(x\.com|twitter\.com)$/, "x"],
  [/(^|\.)threads\.(net|com)$/, "threads"],
  [/(^|\.)facebook\.com$/, "facebook"],
  [/(^|\.)(podcasts\.apple\.com|open\.spotify\.com|anchor\.fm|buzzsprout\.com|podbean\.com)$/, "podcast"],
  [/(^|\.)(substack\.com|beehiiv\.com|buttondown\.email|mailchi\.mp)$/, "newsletter"],
  [/(^|\.)(shopify\.com|etsy\.com|bonfire\.com|teespring\.com|redbubble\.com)$/, "shop"],
  [/(^|\.)(trainingpeaks\.com|finalsurge\.com|vert\.run|calendly\.com)$/, "coaching"],
];

/** Guess the kind of link from its address (the runner can change it). */
export const detectLinkKind = (url: string): LinkKind => {
  const host = linkHost(url).toLowerCase();
  return HOST_KINDS.find(([pattern]) => pattern.test(host))?.[1] ?? "link";
};

/** Sensible default label for a URL, e.g. "Instagram" or "mybrand.com". */
export const defaultLinkLabel = (url: string) => {
  const kind = detectLinkKind(url);
  return kind === "link" ? linkHost(url) : LINK_KIND_LABELS[kind].replace(" profile", "");
};

export const normalizeLinkUrl = (text: string) => normalizeWebUrl(text, 500);

const COLUMNS = "id,user_id,label,url,kind,position";

export const fetchLinks = async (userId: string) => {
  const { data, error } = await supabase.from("profile_links").select(COLUMNS).eq("user_id", userId).order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ProfileLinkRow[];
};

export const addLink = async (userId: string, input: ProfileLinkInput, position: number) => {
  const { error } = await supabase.from("profile_links").insert({ user_id: userId, position, ...input });
  if (error) throw error;
};

export const updateLink = async (id: string, input: Partial<ProfileLinkInput & { position: number }>) => {
  const { error } = await supabase.from("profile_links").update({ ...input, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
};

export const removeLink = async (id: string) => {
  const { error } = await supabase.from("profile_links").delete().eq("id", id);
  if (error) throw error;
};

/** Fire-and-forget: count a visitor's click on a public link. Never blocks or throws. */
export const trackLinkClick = (id: string) => {
  void supabase.functions.invoke("track-link-click", { body: { id } }).catch(() => undefined);
};

export interface LinkClickStats {
  last30: number;
  allTime: number;
}

/** The signed-in runner's click counts, keyed by link id. */
export const fetchLinkClickStats = async () => {
  const { data, error } = await supabase.rpc("link_click_stats");
  if (error) throw error;
  return new Map(
    ((data ?? []) as { link_id: string; last_30_days: number; all_time: number }[])
      .map((row) => [row.link_id, { last30: Number(row.last_30_days), allTime: Number(row.all_time) }]),
  );
};
