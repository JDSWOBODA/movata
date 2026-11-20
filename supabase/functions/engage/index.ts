import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// engage (public; verify_jwt = false)
// POST { kind: "view",  profileId }                                   → counts one profile view
// POST { kind: "cheer", profileId, targetType?, targetId?, emoji? }   → adds a cheer, returns the new total
//
// Called from public profile pages by visitors. Only public profiles count, obvious bots are
// ignored, and no IP or account is stored: each visitor becomes a salted, per-day hash so a
// visitor counts once per day per profile (views) or per target (cheers).

const functionName = "engage";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse/i;
const EMOJI = new Set(["👏", "🔥", "💪", "🏃"]);
const TARGET_TABLE: Record<string, string> = { featured_run: "featured_runs", race: "race_plans" };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const sha256 = async (text: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const userAgent = req.headers.get("user-agent") ?? "";
  if (!userAgent || BOT.test(userAgent)) return json({ ignored: true });

  const body = await req.json().catch(() => null) as { kind?: string; profileId?: string; targetType?: string; targetId?: string; emoji?: string } | null;
  const kind = body?.kind;
  const profileId = body?.profileId ?? "";
  if ((kind !== "view" && kind !== "cheer") || !UUID.test(profileId)) return json({ error: "Invalid request" }, 400);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: profile } = await admin.from("profiles").select("id, is_public").eq("id", profileId).maybeSingle();
  if (!profile?.is_public) return json({ ignored: true });

  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  const day = new Date().toISOString().slice(0, 10);
  const salt = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  if (kind === "view") {
    const visitorKey = await sha256(`${salt}|view|${ip}|${userAgent}|${profileId}|${day}`);
    const { error } = await admin.from("profile_views").upsert(
      { profile_id: profileId, viewed_on: day, visitor_key: visitorKey },
      { onConflict: "profile_id,viewed_on,visitor_key", ignoreDuplicates: true },
    );
    if (error) console.error(`[${functionName}] View insert failed`, error.message);
    return json({ ok: !error });
  }

  // Cheer: validate the target belongs to this profile.
  const targetType = body?.targetType ?? "profile";
  const targetId = targetType === "profile" ? null : body?.targetId ?? "";
  if (!["profile", "featured_run", "race"].includes(targetType) || (targetId !== null && !UUID.test(targetId))) {
    return json({ error: "Invalid cheer" }, 400);
  }
  if (targetId) {
    const { data: target } = await admin.from(TARGET_TABLE[targetType]).select("id").eq("id", targetId).eq("user_id", profileId).maybeSingle();
    if (!target) return json({ error: "Invalid cheer" }, 400);
  }
  const emoji = EMOJI.has(body?.emoji ?? "") ? body!.emoji! : "👏";
  const visitorKey = await sha256(`${salt}|cheer|${ip}|${userAgent}|${profileId}|${targetType}|${targetId ?? "-"}|${day}`);

  const { error } = await admin.from("cheers").insert({ profile_id: profileId, target_type: targetType, target_id: targetId, emoji, cheered_on: day, visitor_key: visitorKey });
  const alreadyCheered = error?.code === "23505";
  if (error && !alreadyCheered) {
    console.error(`[${functionName}] Cheer insert failed`, error.message);
    return json({ error: "Could not cheer right now." }, 500);
  }

  let query = admin.from("cheers").select("id", { count: "exact", head: true }).eq("profile_id", profileId).eq("target_type", targetType);
  query = targetId ? query.eq("target_id", targetId) : query.is("target_id", null);
  const { count } = await query;
  return json({ ok: true, alreadyCheered, total: count ?? 0 });
});
