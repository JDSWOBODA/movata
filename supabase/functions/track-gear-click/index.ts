import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// track-gear-click
// POST { id: <gear item uuid>, type: "product" | "video" } → records one click.
//
// Called from public profile pages, so it accepts requests without a Supabase login
// (verify_jwt = false in config.toml). It only counts links that exist on a public profile,
// ignores obvious bots, and stores no IP or account: each visitor is reduced to a salted,
// per-day hash so repeat clicks the same day count once.

const functionName = "track-gear-click";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse/i;

const respond = (status = 204, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
  });

const sha256 = async (text: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return respond(405, { error: "Method not allowed" });

  const userAgent = req.headers.get("user-agent") ?? "";
  if (!userAgent || BOT.test(userAgent)) return respond();

  const body = await req.json().catch(() => null) as { id?: string; type?: string } | null;
  const id = body?.id ?? "";
  const type = body?.type;
  if (!UUID.test(id) || (type !== "product" && type !== "video")) return respond(400, { error: "Invalid click" });

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: item, error } = await admin
    .from("gear_items")
    .select("id, user_id, product_url, video_url, profiles!inner(is_public)")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error(`[${functionName}] Lookup failed`, error.message);
    return respond(500, { error: "Lookup failed" });
  }
  const profile = item?.profiles as { is_public?: boolean } | { is_public?: boolean }[] | undefined;
  const isPublic = Array.isArray(profile) ? profile[0]?.is_public : profile?.is_public;
  const hasLink = type === "product" ? Boolean(item?.product_url) : Boolean(item?.video_url);
  if (!item || !isPublic || !hasLink) return respond(); // nothing public to count; stay quiet

  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  const day = new Date().toISOString().slice(0, 10);
  const salt = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const visitorKey = await sha256(`${salt}|${ip}|${userAgent}|${id}|${type}|${day}`);

  const { error: insertError } = await admin
    .from("gear_clicks")
    .upsert(
      { gear_item_id: id, owner_id: item.user_id, link_type: type, clicked_on: day, visitor_key: visitorKey },
      { onConflict: "gear_item_id,link_type,clicked_on,visitor_key", ignoreDuplicates: true },
    );
  if (insertError) {
    console.error(`[${functionName}] Insert failed`, insertError.message);
    return respond(500, { error: "Could not record click" });
  }
  return respond();
});
