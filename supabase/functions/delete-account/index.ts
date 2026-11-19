import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// delete-account (signed-in runners only; verify_jwt = true)
// POST { confirm: "<username>" | "DELETE" } → permanently deletes the caller's account.
//
// Order matters: things outside our database go first, while we can still find them.
//   1. Revoke Movata's Strava access (strava-sync "disconnect" also clears cached runs).
//   2. Cancel any active Stripe subscription, so a deleted account is never billed again.
//   3. Delete the runner's uploaded images (storage files don't cascade).
//   4. Delete the Auth user. Every table references it (directly or via profiles) with
//      ON DELETE CASCADE: profile, featured runs, races, gear, gear clicks, Strava
//      connection and cache, and billing rows.

const functionName = "delete-account";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const MEDIA_BUCKET = "profile-media";
const MEDIA_FOLDERS = ["avatar", "cover", "run", "gear"];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const deleteMedia = async (admin: SupabaseClient, userId: string) => {
  let removed = 0;
  for (const folder of MEDIA_FOLDERS) {
    const prefix = `${userId}/${folder}`;
    for (let round = 0; round < 50; round += 1) {
      const { data, error } = await admin.storage.from(MEDIA_BUCKET).list(prefix, { limit: 100 });
      if (error) throw new Error(`Listing ${folder} images failed: ${error.message}`);
      const files = (data ?? []).filter((item) => item.name && item.id);
      if (!files.length) break;
      const { error: removeError } = await admin.storage.from(MEDIA_BUCKET).remove(files.map((file) => `${prefix}/${file.name}`));
      if (removeError) throw new Error(`Deleting ${folder} images failed: ${removeError.message}`);
      removed += files.length;
    }
  }
  return removed;
};

const cancelStripe = async (admin: SupabaseClient, userId: string) => {
  const { data } = await admin.from("billing_subscriptions").select("stripe_subscription_id, status").eq("user_id", userId).maybeSingle();
  const subscriptionId = data?.stripe_subscription_id;
  if (!subscriptionId || ["canceled", "incomplete_expired"].includes(data?.status ?? "")) return "none";
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) throw new Error("This account has a subscription, but billing isn't configured to cancel it. Contact support.");
  const response = await fetch(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(subscriptionId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${stripeKey}` },
  });
  if (!response.ok && response.status !== 404) throw new Error("Your subscription couldn't be canceled, so the account wasn't deleted. Please try again.");
  return "canceled";
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const authClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
  const { data: userData } = await authClient.auth.getUser(authHeader.replace(/^Bearer /, ""));
  const user = userData?.user;
  if (!user) return json({ error: "Your session has expired. Sign in again to delete your account." }, 401);

  const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const body = await req.json().catch(() => ({})) as { confirm?: string };
  const { data: profile } = await admin.from("profiles").select("username").eq("id", user.id).maybeSingle();
  const expected = profile?.username ?? "DELETE";
  if ((body.confirm ?? "").trim() !== expected) {
    return json({ error: `Type ${profile ? `your username (${expected})` : "DELETE"} to confirm.` }, 400);
  }

  const steps: Record<string, unknown> = {};
  try {
    // 1. Strava: revoke access on Strava's side (best effort; the cascade removes our copy anyway).
    const { data: strava } = await admin.from("provider_connections").select("id").eq("user_id", user.id).eq("provider", "strava").maybeSingle();
    if (strava) {
      const response = await fetch(`${supabaseUrl}/functions/v1/strava-sync`, {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect" }),
      }).catch(() => null);
      steps.strava = response?.ok ? "revoked" : "local-delete-only";
    }

    // 2. Stripe: must succeed if there is something to cancel.
    steps.billing = await cancelStripe(admin, user.id);

    // 3. Uploaded images.
    steps.images = await deleteMedia(admin, user.id);

    // 4. The account itself; the database cascades from here.
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) throw new Error(`Account deletion failed: ${deleteError.message}`);

    console.log(`[${functionName}] Account deleted`, { userId: user.id, ...steps });
    return json({ deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Account deletion failed.";
    console.error(`[${functionName}] Failed`, { userId: user.id, steps, message });
    return json({ error: message }, 500);
  }
});
