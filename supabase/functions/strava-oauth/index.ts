import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const functionName = "strava-oauth";
const callbackUrl = "https://txaicetmxfehpnhjmjpc.supabase.co/functions/v1/strava-oauth";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const toBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const fromBase64Url = (value: string) => {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
};

const importHmacKey = (secret: string) => crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(secret),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign", "verify"],
);

const createState = async (userId: string, secret: string) => {
  const payload = toBase64Url(new TextEncoder().encode(JSON.stringify({ userId, expiresAt: Date.now() + 10 * 60_000, nonce: crypto.randomUUID() })));
  const signature = await crypto.subtle.sign("HMAC", await importHmacKey(secret), new TextEncoder().encode(payload));
  return `${payload}.${toBase64Url(new Uint8Array(signature))}`;
};

const readState = async (state: string, secret: string) => {
  const [payload, signature] = state.split(".");
  if (!payload || !signature) throw new Error("Invalid OAuth state");
  const valid = await crypto.subtle.verify("HMAC", await importHmacKey(secret), fromBase64Url(signature), new TextEncoder().encode(payload));
  if (!valid) throw new Error("Invalid OAuth state signature");
  const data = JSON.parse(new TextDecoder().decode(fromBase64Url(payload)));
  if (!data.userId || data.expiresAt < Date.now()) throw new Error("OAuth state has expired");
  return data as { userId: string };
};

const encryptToken = async (token: string, secret: string) => {
  const keyMaterial = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  const key = await crypto.subtle.importKey("raw", keyMaterial, "AES-GCM", false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(token));
  return `v1:${toBase64Url(iv)}:${toBase64Url(new Uint8Array(encrypted))}`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const appUrl = Deno.env.get("APP_URL");
  const clientId = Deno.env.get("STRAVA_CLIENT_ID");
  const clientSecret = Deno.env.get("STRAVA_CLIENT_SECRET");
  const stateSecret = Deno.env.get("STRAVA_STATE_SECRET");
  const encryptionKey = Deno.env.get("STRAVA_TOKEN_ENCRYPTION_KEY");
  if (!appUrl || !clientId || !clientSecret || !stateSecret || !encryptionKey) {
    console.error(`[${functionName}] Missing Strava configuration`);
    return json({ error: "Strava OAuth is not configured yet." }, 503);
  }

  try {
    const requestUrl = new URL(req.url);
    const code = requestUrl.searchParams.get("code");
    const state = requestUrl.searchParams.get("state");
    const oauthError = requestUrl.searchParams.get("error");

    if (req.method === "GET" && (code || oauthError)) {
      if (oauthError) return Response.redirect(`${appUrl.replace(/\/$/, "")}/dashboard?strava=denied`, 302);
      if (!state || !code) throw new Error("Missing OAuth callback parameters");
      const { userId } = await readState(state, stateSecret);

      const tokenResponse = await fetch("https://www.strava.com/api/v3/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, grant_type: "authorization_code" }),
      });
      const tokens = await tokenResponse.json();
      if (!tokenResponse.ok || !tokens.access_token || !tokens.refresh_token || !tokens.athlete?.id) {
        throw new Error(tokens.message ?? "Strava token exchange failed");
      }

      const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { error } = await admin.from("provider_connections").upsert({
        user_id: userId,
        provider: "strava",
        provider_user_id: String(tokens.athlete.id),
        encrypted_access_token: await encryptToken(tokens.access_token, encryptionKey),
        encrypted_refresh_token: await encryptToken(tokens.refresh_token, encryptionKey),
        token_expiration: new Date(tokens.expires_at * 1000).toISOString(),
        sync_status: "connected",
        sync_error: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,provider,provider_user_id" });
      if (error) throw error;

      console.log(`[${functionName}] Strava connection stored`, { userId, athleteId: tokens.athlete.id });
      return Response.redirect(`${appUrl.replace(/\/$/, "")}/dashboard?strava=connected`, 302);
    }

    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Sign in to connect Strava." }, 401);

    const token = authHeader.slice(7);
    const authClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await authClient.auth.getUser(token);
    if (userError || !userData.user) return json({ error: "Your session has expired. Please sign in again." }, 401);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: entitlement } = await admin
      .from("billing_subscriptions")
      .select("status")
      .eq("user_id", userData.user.id)
      .maybeSingle();
    if (!entitlement || !["active", "trialing"].includes(entitlement.status)) {
      return json({ error: "A $3/year subscription is required before connecting Strava.", requiresCheckout: true }, 402);
    }

    const authorize = new URL("https://www.strava.com/oauth/authorize");
    authorize.searchParams.set("client_id", clientId);
    authorize.searchParams.set("redirect_uri", callbackUrl);
    authorize.searchParams.set("response_type", "code");
    authorize.searchParams.set("approval_prompt", "auto");
    authorize.searchParams.set("scope", "read,activity:read_all");
    authorize.searchParams.set("state", await createState(userData.user.id, stateSecret));

    console.log(`[${functionName}] OAuth authorization started`, { userId: userData.user.id });
    return json({ url: authorize.toString() });
  } catch (error) {
    console.error(`[${functionName}] OAuth flow failed`, { error: error instanceof Error ? error.message : String(error) });
    if (req.method === "GET" && appUrl) return Response.redirect(`${appUrl.replace(/\/$/, "")}/dashboard?strava=error`, 302);
    return json({ error: "Unable to connect Strava right now." }, 500);
  }
});
