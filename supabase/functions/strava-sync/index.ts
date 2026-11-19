import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// strava-sync
// POST { action: "sync" }       → pulls the signed-in athlete's runs from Strava into the 7-day cache
// POST { action: "disconnect" } → revokes Movata's Strava access and deletes all cached Strava data
//
// Strava API Policy notes baked into this function:
//  - Data is cached for at most 7 days (6.2): every sync re-stamps fetched_at and purges older rows.
//  - Activities deleted on Strava disappear on the next full sync (6.3).
//  - Cached rows are readable only by their owner via RLS (2.3 / 6.1).

const functionName = "strava-sync";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STRAVA_API = "https://www.strava.com/api/v3";
const PAGE_SIZE = 200;
const MAX_PAGES = 15; // ~3,000 activities; keeps one sync well inside Strava's read rate limit
const RUN_SPORT_TYPES = new Set(["Run", "TrailRun", "VirtualRun"]);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// ---- token encryption (must match strava-oauth) -------------------------------------------
const toBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const fromBase64Url = (value: string) => {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
};

const aesKey = async (secret: string, usage: "encrypt" | "decrypt") => {
  const keyMaterial = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", keyMaterial, "AES-GCM", false, [usage]);
};

const encryptToken = async (token: string, secret: string) => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await aesKey(secret, "encrypt"), new TextEncoder().encode(token));
  return `v1:${toBase64Url(iv)}:${toBase64Url(new Uint8Array(encrypted))}`;
};

const decryptToken = async (value: string, secret: string) => {
  const [version, iv, data] = value.split(":");
  if (version !== "v1" || !iv || !data) throw new Error("Unrecognized token format");
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromBase64Url(iv) }, await aesKey(secret, "decrypt"), fromBase64Url(data));
  return new TextDecoder().decode(decrypted);
};

// ---- Strava → Movata mapping ----------------------------------------------------------------
interface StravaActivity {
  id: number;
  name: string;
  sport_type?: string;
  type?: string;
  start_date: string;
  start_date_local: string;
  timezone?: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain?: number;
  average_speed?: number;
  max_speed?: number;
  average_heartrate?: number;
  max_heartrate?: number;
  kilojoules?: number;
  workout_type?: number | null;
  trainer?: boolean;
  location_city?: string | null;
  location_state?: string | null;
  map?: { summary_polyline?: string | null };
}

const activityTypeFor = (a: StravaActivity) => {
  if (a.workout_type === 1) return "Race";
  if (a.trainer || a.sport_type === "VirtualRun") return "Treadmill";
  if (a.sport_type === "TrailRun") return "Trail Run";
  if (a.workout_type === 3) return "Workout";
  return "Run";
};

const workoutLabel: Record<number, string> = { 0: "Easy", 1: "Race", 2: "Long Run", 3: "Workout" };

const normalize = (a: StravaActivity) => {
  const km = a.distance / 1000;
  const activityType = activityTypeFor(a);
  return {
    id: `strava-${a.id}`,
    externalId: String(a.id),
    provider: "strava",
    title: a.name || "Strava run",
    activityType,
    startedAt: a.start_date,
    // start_date_local is the athlete's wall-clock time with a fake "Z" suffix; the date part is their local date.
    localDate: a.start_date_local.slice(0, 10),
    timezone: a.timezone?.split(" ").pop() ?? "UTC",
    distanceMeters: a.distance,
    movingTimeSeconds: a.moving_time,
    elapsedTimeSeconds: a.elapsed_time,
    averagePaceSecondsPerKm: km > 0 ? Math.round(a.moving_time / km) : undefined,
    bestPaceSecondsPerKm: a.max_speed ? Math.round(1000 / a.max_speed) : undefined,
    elevationGainMeters: a.total_elevation_gain,
    averageHeartRate: a.average_heartrate,
    maximumHeartRate: a.max_heartrate,
    calories: a.kilojoules ? Math.round(a.kilojoules / 4.184) : undefined,
    routePolyline: a.map?.summary_polyline ?? undefined,
    location: [a.location_city, a.location_state].filter(Boolean).join(", ") || undefined,
    workoutType: a.workout_type != null ? workoutLabel[a.workout_type] : undefined,
    privacy: "private", // Strava data is only ever shown to its owner
    isRace: activityType === "Race",
    isIndoor: activityType === "Treadmill",
    includeInStreak: true,
  };
};

// ---- helpers --------------------------------------------------------------------------------
class StravaError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

const stravaGet = async (path: string, accessToken: string) => {
  const response = await fetch(`${STRAVA_API}${path}`, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (response.status === 429) throw new StravaError("Strava's rate limit was reached. Try syncing again in 15 minutes.", 429);
  if (response.status === 401) throw new StravaError("Strava access was revoked or expired. Please reconnect Strava.", 401);
  if (!response.ok) throw new StravaError(`Strava returned ${response.status}`, response.status);
  return response.json();
};

const getAccessToken = async (
  admin: SupabaseClient,
  connection: { id: string; encrypted_access_token: string; encrypted_refresh_token: string; token_expiration: string },
  env: { clientId: string; clientSecret: string; encryptionKey: string },
) => {
  const expiresAt = new Date(connection.token_expiration).getTime();
  if (expiresAt - Date.now() > 5 * 60_000) return decryptToken(connection.encrypted_access_token, env.encryptionKey);

  const refreshToken = await decryptToken(connection.encrypted_refresh_token, env.encryptionKey);
  const response = await fetch("https://www.strava.com/api/v3/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: env.clientId, client_secret: env.clientSecret, grant_type: "refresh_token", refresh_token: refreshToken }),
  });
  const tokens = await response.json();
  if (!response.ok || !tokens.access_token) throw new StravaError("Strava access expired. Please reconnect Strava.", 401);

  const { error } = await admin.from("provider_connections").update({
    encrypted_access_token: await encryptToken(tokens.access_token, env.encryptionKey),
    encrypted_refresh_token: await encryptToken(tokens.refresh_token ?? refreshToken, env.encryptionKey),
    token_expiration: new Date(tokens.expires_at * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", connection.id);
  if (error) throw error;
  return tokens.access_token as string;
};

// ---- handler --------------------------------------------------------------------------------
console.info("[strava-sync] Function initialized");

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const clientId = Deno.env.get("STRAVA_CLIENT_ID");
  const clientSecret = Deno.env.get("STRAVA_CLIENT_SECRET");
  const encryptionKey = Deno.env.get("STRAVA_TOKEN_ENCRYPTION_KEY");
  if (!clientId || !clientSecret || !encryptionKey) {
    console.error(`[${functionName}] Missing Strava configuration`);
    return json({ error: "Strava sync is not configured yet." }, 503);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Sign in to sync Strava." }, 401);
  const authClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await authClient.auth.getUser(authHeader.slice(7));
  if (userError || !userData.user) return json({ error: "Your session has expired. Please sign in again." }, 401);
  const userId = userData.user.id;

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const body = await req.json().catch(() => ({})) as { action?: string };
  const action = body.action ?? "sync";

  const { data: connection, error: connectionError } = await admin
    .from("provider_connections")
    .select("id, encrypted_access_token, encrypted_refresh_token, token_expiration")
    .eq("user_id", userId)
    .eq("provider", "strava")
    .maybeSingle();
  if (connectionError) {
    console.error(`[${functionName}] Connection lookup failed`, connectionError);
    return json({ error: "Unable to read your Strava connection." }, 500);
  }

  // Disconnect: revoke on Strava's side, then delete everything we hold.
  if (action === "disconnect") {
    if (connection) {
      try {
        const accessToken = await getAccessToken(admin, connection, { clientId, clientSecret, encryptionKey });
        await fetch("https://www.strava.com/oauth/deauthorize", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ access_token: accessToken }),
        });
      } catch (error) {
        console.warn(`[${functionName}] Deauthorize call failed; deleting local data anyway`, String(error));
      }
    }
    await admin.from("strava_activities").delete().eq("user_id", userId);
    await admin.from("provider_connections").delete().eq("user_id", userId).eq("provider", "strava");
    console.log(`[${functionName}] Strava disconnected`, { userId });
    return json({ disconnected: true });
  }

  if (action !== "sync") return json({ error: "Unknown action" }, 400);
  if (!connection) return json({ error: "Connect Strava first." }, 404);

  const syncStartedAt = new Date().toISOString();
  try {
    await admin.rpc("purge_stale_strava_cache");
    const accessToken = await getAccessToken(admin, connection, { clientId, clientSecret, encryptionKey });

    const runs: ReturnType<typeof normalize>[] = [];
    let complete = false;
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const batch = await stravaGet(`/athlete/activities?per_page=${PAGE_SIZE}&page=${page}`, accessToken) as StravaActivity[];
      batch
        .filter((a) => RUN_SPORT_TYPES.has(a.sport_type ?? a.type ?? ""))
        .forEach((a) => runs.push(normalize(a)));
      if (batch.length < PAGE_SIZE) {
        complete = true;
        break;
      }
    }

    for (let i = 0; i < runs.length; i += 500) {
      const rows = runs.slice(i, i + 500).map((run) => ({
        user_id: userId,
        strava_activity_id: Number(run.externalId),
        activity: run,
        local_date: run.localDate,
        fetched_at: syncStartedAt,
      }));
      const { error } = await admin.from("strava_activities").upsert(rows, { onConflict: "user_id,strava_activity_id" });
      if (error) throw error;
    }

    // Full history fetched → anything not re-stamped was deleted (or changed to a non-run) on Strava.
    if (complete) {
      await admin.from("strava_activities").delete().eq("user_id", userId).lt("fetched_at", syncStartedAt);
    }

    await admin.from("provider_connections").update({
      sync_status: "connected",
      sync_error: null,
      last_synced_at: syncStartedAt,
      updated_at: syncStartedAt,
    }).eq("id", connection.id);

    console.log(`[${functionName}] Sync complete`, { userId, runs: runs.length, complete });
    return json({ synced: runs.length, complete });
  } catch (error) {
    const message = error instanceof StravaError ? error.message : "Strava sync failed. Please try again.";
    console.error(`[${functionName}] Sync failed`, { userId, error: error instanceof Error ? error.message : String(error) });
    await admin.from("provider_connections").update({
      sync_status: error instanceof StravaError && error.status === 401 ? "needs_reconnect" : "connected",
      sync_error: message,
      updated_at: new Date().toISOString(),
    }).eq("id", connection.id);
    return json({ error: message }, error instanceof StravaError ? error.status : 500);
  }
});
