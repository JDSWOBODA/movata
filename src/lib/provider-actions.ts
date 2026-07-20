import { supabase } from "@/integrations/supabase/client";

interface FunctionResult {
  url?: string;
  error?: string;
  alreadyActive?: boolean;
  requiresCheckout?: boolean;
}

const readFunctionError = async (error: unknown, data: FunctionResult | null) => {
  if (data?.error) return data.error;

  const context = (error as { context?: Response } | null)?.context;
  if (context) {
    try {
      const body = await context.clone().json() as { error?: string };
      if (body.error) return body.error;
    } catch {
      // Fall through to the SDK message when the response is not JSON.
    }
  }

  return error instanceof Error ? error.message : "The connection request could not be completed.";
};

const invoke = async (functionName: "create-stripe-checkout" | "strava-oauth") => {
  const { data, error } = await supabase.functions.invoke<FunctionResult>(functionName, {
    body: {},
  });

  if (error) throw new Error(await readFunctionError(error, data));
  if (data?.error) throw new Error(data.error);
  return data;
};

export const beginStripeCheckout = async () => {
  const result = await invoke("create-stripe-checkout");
  if (result.alreadyActive) return false;
  if (!result.url) throw new Error("Stripe checkout did not return a destination.");
  window.location.assign(result.url);
  return true;
};

export const beginStravaOAuth = async () => {
  const result = await invoke("strava-oauth");
  if (result.requiresCheckout) return false;
  if (!result.url) throw new Error("Strava did not return an authorization destination.");
  window.location.assign(result.url);
  return true;
};
