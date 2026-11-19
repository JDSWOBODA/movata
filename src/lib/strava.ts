import { supabase } from "@/integrations/supabase/client";
import type { NormalizedActivity } from "./movata-types";

/** Flip to true (and set STRAVA_REQUIRE_SUBSCRIPTION=true in Supabase) to bring back the $3/year paywall. */
export const STRAVA_REQUIRES_SUBSCRIPTION = false;

/** Re-sync automatically when the cache is older than this. Must stay well under Strava's 7-day cache limit. */
export const STRAVA_AUTO_SYNC_AFTER_MS = 6 * 60 * 60 * 1000;

export interface StravaConnection {
  sync_status: string;
  last_synced_at: string | null;
  sync_error: string | null;
}

const functionError = async (error: unknown, data: { error?: string } | null) => {
  if (data?.error) return data.error;
  const context = (error as { context?: Response } | null)?.context;
  if (context) {
    try {
      const body = await context.clone().json() as { error?: string };
      if (body.error) return body.error;
    } catch {
      // not JSON
    }
  }
  return error instanceof Error ? error.message : "Strava request failed.";
};

const callSync = async (action: "sync" | "disconnect") => {
  const { data, error } = await supabase.functions.invoke<{ error?: string; synced?: number; disconnected?: boolean }>("strava-sync", {
    body: { action },
  });
  if (error || data?.error) throw new Error(await functionError(error, data));
  return data;
};

export const syncStrava = () => callSync("sync");
export const disconnectStrava = () => callSync("disconnect");

export const fetchStravaConnection = async (userId: string) => {
  const { data, error } = await supabase
    .from("provider_connections")
    .select("sync_status,last_synced_at,sync_error")
    .eq("user_id", userId)
    .eq("provider", "strava")
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as StravaConnection | null;
};

/** Reads the signed-in athlete's cached Strava runs (RLS limits this to their own rows). */
export const fetchStravaActivities = async (userId: string) => {
  const { data, error } = await supabase
    .from("strava_activities")
    .select("activity")
    .eq("user_id", userId)
    .order("local_date", { ascending: false })
    .limit(5000);
  if (error) throw error;
  return (data ?? []).map((row) => row.activity as NormalizedActivity);
};

export const stravaActivityUrl = (activity: NormalizedActivity) =>
  activity.provider === "strava" && activity.externalId ? `https://www.strava.com/activities/${activity.externalId}` : undefined;
