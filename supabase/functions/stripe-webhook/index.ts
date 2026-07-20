import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const verifyStripeSignature = async (payload: string, header: string, secret: string) => {
  const parts = Object.fromEntries(header.split(",").map((part) => part.split("=", 2)));
  const timestamp = Number(parts.t);
  const signature = parts.v1;
  if (!timestamp || !signature || Math.abs(Date.now() / 1000 - timestamp) > 300) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${payload}`));
  const expected = Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
  if (expected.length !== signature.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) difference |= expected.charCodeAt(index) ^ signature.charCodeAt(index);
  return difference === 0;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const signature = req.headers.get("stripe-signature");
  if (!webhookSecret || !signature) return json({ error: "Webhook is not configured." }, 503);

  const payload = await req.text();
  if (!(await verifyStripeSignature(payload, signature, webhookSecret))) {
    console.warn("[stripe-webhook] Invalid Stripe signature");
    return json({ error: "Invalid signature" }, 400);
  }

  try {
    const event = JSON.parse(payload);
    const object = event.data.object;
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    if (event.type === "checkout.session.completed") {
      const userId = object.client_reference_id ?? object.metadata?.user_id;
      if (!userId) throw new Error("Checkout session is missing user metadata");
      const { error } = await supabase.from("billing_subscriptions").upsert({
        user_id: userId,
        stripe_customer_id: typeof object.customer === "string" ? object.customer : object.customer?.id,
        stripe_subscription_id: typeof object.subscription === "string" ? object.subscription : object.subscription?.id,
        status: "active",
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
      if (error) throw error;
      console.log("[stripe-webhook] Checkout entitlement activated", { userId, eventId: event.id });
    }

    if (["customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) {
      const userId = object.metadata?.user_id;
      if (!userId) throw new Error("Subscription is missing user metadata");
      const allowedStatuses = ["trialing", "active", "past_due", "canceled", "unpaid"];
      const status = event.type === "customer.subscription.deleted"
        ? "canceled"
        : allowedStatuses.includes(object.status) ? object.status : "inactive";
      const { error } = await supabase.from("billing_subscriptions").upsert({
        user_id: userId,
        stripe_customer_id: typeof object.customer === "string" ? object.customer : object.customer?.id,
        stripe_subscription_id: object.id,
        status,
        current_period_end: object.current_period_end ? new Date(object.current_period_end * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
      if (error) throw error;
      console.log("[stripe-webhook] Subscription status updated", { userId, status, eventId: event.id });
    }

    return json({ received: true });
  } catch (error) {
    console.error("[stripe-webhook] Processing failed", { error: error instanceof Error ? error.message : String(error) });
    return json({ error: "Webhook processing failed" }, 500);
  }
});
