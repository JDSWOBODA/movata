import { supabase } from "@/integrations/supabase/client";

export type CheerTarget = "profile" | "featured_run" | "race";

const cheerKey = (type: CheerTarget, id?: string | null) => `${type}:${id ?? ""}`;

const safeStorage = {
  get: (key: string) => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set: (key: string, value: string) => {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // private mode / blocked storage: the server still dedupes per day
    }
  },
};

const today = () => new Date().toISOString().slice(0, 10);

/** Count a visitor's view of a public profile. The server counts each visitor once per day. */
export const trackProfileView = (profileId: string) => {
  void supabase.functions.invoke("engage", { body: { kind: "view", profileId } }).catch(() => undefined);
};

/** Whether this browser already cheered this target today (so the button shows "Cheered"). */
export const cheeredToday = (profileId: string, type: CheerTarget, id?: string | null) =>
  Boolean(safeStorage.get(`movata:cheer:${profileId}:${cheerKey(type, id)}:${today()}`));

export const sendCheer = async (profileId: string, type: CheerTarget, id?: string | null) => {
  safeStorage.set(`movata:cheer:${profileId}:${cheerKey(type, id)}:${today()}`, "1");
  const { data, error } = await supabase.functions.invoke<{ ok?: boolean; total?: number; alreadyCheered?: boolean; error?: string }>("engage", {
    body: { kind: "cheer", profileId, targetType: type, targetId: id ?? undefined },
  });
  if (error || !data?.ok) throw new Error(data?.error ?? "Couldn't send your cheer.");
  return { total: data.total ?? 0, alreadyCheered: Boolean(data.alreadyCheered) };
};

/** Public cheer totals for a profile, keyed by "type:id". */
export const fetchCheerCounts = async (profileId: string) => {
  const { data, error } = await supabase.rpc("public_cheer_counts", { p_profile_id: profileId });
  if (error) throw error;
  const counts = new Map<string, number>();
  ((data ?? []) as { target_type: CheerTarget; target_id: string | null; total: number }[]).forEach((row) => {
    counts.set(cheerKey(row.target_type, row.target_id), Number(row.total));
  });
  return counts;
};

export const cheerCount = (counts: Map<string, number> | undefined, type: CheerTarget, id?: string | null) => counts?.get(cheerKey(type, id)) ?? 0;

export interface EngagementSummary {
  views7: number;
  viewsPrev7: number;
  cheers7: number;
  cheersPrev7: number;
  clicks7: number;
  clicksPrev7: number;
  newCheers: number;
}

export const fetchEngagementSummary = async (): Promise<EngagementSummary> => {
  const { data, error } = await supabase.rpc("engagement_summary");
  if (error) throw error;
  const row = (Array.isArray(data) ? data[0] : data) as Record<string, number> | undefined;
  const n = (key: string) => Number(row?.[key] ?? 0);
  return {
    views7: n("views_7d"), viewsPrev7: n("views_prev_7d"),
    cheers7: n("cheers_7d"), cheersPrev7: n("cheers_prev_7d"),
    clicks7: n("gear_clicks_7d"), clicksPrev7: n("gear_clicks_prev_7d"),
    newCheers: n("new_cheers"),
  };
};

export const markCheersSeen = async (userId: string) => {
  const { error } = await supabase.from("profiles").update({ cheers_seen_at: new Date().toISOString() }).eq("id", userId);
  if (error) throw error;
};

/** Whole days from today (local) until a YYYY-MM-DD date; negative once it has passed. */
export const daysUntil = (date: string) => {
  const now = new Date();
  const start = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const [y, m, d] = date.split("-").map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - start) / 86_400_000);
};

export const countdownLabel = (days: number) =>
  days === 0 ? "Race day!" : days === 1 ? "Tomorrow" : days <= 7 ? `Race week · ${days} days` : `${days} days to go`;
