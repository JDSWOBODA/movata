import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

console.info("[create-stripe-checkout] Function initialized");

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Sign in to unlock Strava sync." }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const stripePriceId = Deno.env.get("STRIPE_PRICE_ID");
    const appUrl = Deno.env.get("APP_URL");

    if (!stripeKey || !stripePriceId || !appUrl) {
      console.error("[create-stripe-checkout] Missing Stripe configuration");
      return json({ error: "Stripe checkout is not configured yet." }, 503);
    }

    const token = authHeader.slice(7);
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await authClient.auth.getUser(token);
    if (userError || !userData.user) return json({ error: "Your session has expired. Please sign in again." }, 401);

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: entitlement } = await admin
      .from("billing_subscriptions")
      .select("status")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (entitlement && ["active", "trialing"].includes(entitlement.status)) {
      console.log("[create-stripe-checkout] Existing active entitlement", { userId: userData.user.id });
      return json({ alreadyActive: true });
    }

    const params = new URLSearchParams();
    params.set("mode", "subscription");
    params.set("success_url", `${appUrl.replace(/\/$/, "")}/dashboard?billing=success`);
    params.set("cancel_url", `${appUrl.replace(/\/$/, "")}/dashboard?billing=canceled`);
    params.set("client_reference_id", userData.user.id);
    params.set("metadata[user_id]", userData.user.id);
    params.set("subscription_data[metadata][user_id]", userData.user.id);
    params.set("line_items[0][price]", stripePriceId);
    params.set("line_items[0][quantity]", "1");
    if (userData.user.email) params.set("customer_email", userData.user.email);

    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });
    const session = await stripeResponse.json();

    if (!stripeResponse.ok || !session.url) {
      console.error("[create-stripe-checkout] Stripe session creation failed", { status: stripeResponse.status, error: session.error?.message });
      return json({ error: session.error?.message ?? "Unable to start checkout." }, 502);
    }

    console.log("[create-stripe-checkout] Checkout created", { userId: userData.user.id, sessionId: session.id });
    return json({ url: session.url });
  } catch (error) {
    console.error("[create-stripe-checkout] Unexpected error", { error: error instanceof Error ? error.message : String(error) });
    return json({ error: "Unable to start checkout right now." }, 500);
  }
});
