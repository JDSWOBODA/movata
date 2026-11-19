import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, ChevronDown, Clock, Link2, LoaderCircle, Lock, Upload, Wrench } from "lucide-react";
import { toast } from "sonner";
import { providerCatalog } from "@/lib/provider-adapters";
import { beginStravaOAuth, beginStripeCheckout } from "@/lib/provider-actions";
import { STRAVA_REQUIRES_SUBSCRIPTION } from "@/lib/strava";
import { Button } from "@/components/ui/button";
import { useSession } from "@/contexts/SessionContext";
import { supabase } from "@/integrations/supabase/client";

interface ConnectionState {
  sync_status: string;
  last_synced_at: string | null;
  sync_error: string | null;
}

const iconFor = (status: string, connected = false) => {
  if (connected) return <Link2 className="h-5 w-5 text-emerald-700" />;
  if (status === "active") return <Upload className="h-5 w-5 text-emerald-700" />;
  if (status === "manual") return <CheckCircle2 className="h-5 w-5 text-emerald-700" />;
  if (status === "paywalled") return <Lock className="h-5 w-5 text-emerald-700" />;
  return <Clock className="h-5 w-5 text-stone-400" />;
};

const errorMessage = (error: unknown) => error instanceof Error ? error.message : "Unable to connect right now.";
const primaryProviders = providerCatalog.filter(({ provider }) => provider === "strava" || provider === "csv");
const otherProviders = providerCatalog.filter(({ provider }) => provider !== "strava" && provider !== "csv");

export const ProviderGrid = () => {
  const { user } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [stravaConnection, setStravaConnection] = useState<ConnectionState | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [actionProvider, setActionProvider] = useState<string | null>(null);
  const [showOtherTools, setShowOtherTools] = useState(false);

  useEffect(() => {
    if (!user) {
      setSubscriptionStatus(null);
      setStravaConnection(null);
      setStatusLoading(false);
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const billingReturn = new URLSearchParams(location.search).get("billing") === "success";

    const refresh = async () => {
      setStatusLoading(true);
      const [subscription, connection] = await Promise.all([
        supabase.from("billing_subscriptions").select("status").eq("user_id", user.id).maybeSingle(),
        supabase.from("provider_connections").select("sync_status,last_synced_at,sync_error").eq("user_id", user.id).eq("provider", "strava").maybeSingle(),
      ]);

      if (cancelled) return false;
      if (subscription.error) toast.error("Unable to check your Strava subscription.");
      if (connection.error) toast.error("Unable to check your Strava connection.");
      setSubscriptionStatus(subscription.data?.status ?? null);
      setStravaConnection(connection.data ?? null);
      setStatusLoading(false);
      return ["active", "trialing"].includes(subscription.data?.status ?? "");
    };

    void refresh();
    if (!billingReturn) return () => { cancelled = true; };

    toast.success("Payment received. Activating Strava sync…");
    const interval = window.setInterval(() => {
      attempts += 1;
      void refresh().then((active) => {
        if (active || attempts >= 6) window.clearInterval(interval);
      });
    }, 2000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [location.search, user]);

  useEffect(() => {
    const result = new URLSearchParams(location.search).get("strava");
    if (result === "connected") toast.success("Strava connected successfully.");
    if (result === "denied") toast.info("Strava connection was canceled.");
    if (result === "error") toast.error("Strava could not be connected. Please try again.");
  }, [location.search]);

  const billingActive = !STRAVA_REQUIRES_SUBSCRIPTION || ["active", "trialing"].includes(subscriptionStatus ?? "");
  const stravaConnected = stravaConnection?.sync_status === "connected";

  const handleStrava = async () => {
    if (!user) {
      navigate("/login", { state: { from: { pathname: "/dashboard" } } });
      toast.info("Sign in before connecting Strava.");
      return;
    }

    setActionProvider("strava");
    try {
      if (!billingActive) {
        const redirected = await beginStripeCheckout();
        if (redirected) return;
      }

      const redirected = await beginStravaOAuth();
      if (!redirected) await beginStripeCheckout();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setActionProvider(null);
    }
  };

  const handleFreeProvider = (provider: "csv" | "manual") => {
    if (!user) {
      navigate("/login", { state: { from: { pathname: "/dashboard" } } });
      toast.info("Sign in to add your runs.");
      return;
    }
    navigate(`/dashboard#${provider === "csv" ? "activities" : "activities"}`);
    toast.info(provider === "csv" ? "CSV import is next in the activity manager." : "Manual run entry is next in the activity manager.");
  };

  return (
    <div className="grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {primaryProviders.map((provider) => {
        const isStrava = provider.provider === "strava";
        const isConnected = isStrava && stravaConnected;
        const busy = isStrava && actionProvider === "strava";
        const disabled = isConnected || busy || (isStrava && statusLoading);
        const statusLabel = isConnected ? "connected" : isStrava && !STRAVA_REQUIRES_SUBSCRIPTION ? "free beta" : isStrava && billingActive ? "unlocked" : provider.status === "paywalled" ? "$3/yr" : provider.status;
        const buttonLabel = isConnected
          ? "Strava Connected"
          : busy
            ? billingActive ? "Opening Strava…" : "Opening checkout…"
            : isStrava && billingActive
              ? "Connect Strava"
              : provider.status === "paywalled"
                ? "Unlock Strava Sync"
                : "Start CSV Import";

        return (
          <div key={provider.provider} className={`rounded-[1.25rem] border bg-white p-4 shadow-sm ${isConnected ? "border-emerald-300" : "border-stone-200"}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone-100">{iconFor(provider.status, isConnected)}</span>
                <div className="min-w-0">
                  <h3 className="font-semibold text-stone-950">{provider.label}</h3>
                  <p className="text-sm text-stone-500">{isConnected ? "Securely linked to your Movata" : isStrava && !STRAVA_REQUIRES_SUBSCRIPTION ? "Sync your runs to your private dashboard" : provider.detail}</p>
                </div>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${isConnected ? "bg-emerald-700 text-white" : "bg-emerald-50 text-emerald-800"}`}>
                {statusLabel}
              </span>
            </div>
            {isStrava && stravaConnection?.sync_error ? (
              <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-800">{stravaConnection.sync_error}</p>
            ) : null}
            <Button
              disabled={disabled}
              variant="secondary"
              className="mt-4 w-full rounded-full"
              onClick={isStrava ? () => void handleStrava() : () => handleFreeProvider("csv")}
            >
              {busy || (isStrava && statusLoading) ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
              {buttonLabel}
            </Button>
          </div>
        );
      })}

      <div className="rounded-[1.25rem] border border-stone-200 bg-white p-4 shadow-sm sm:col-span-2 lg:col-span-1">
        <button
          type="button"
          aria-expanded={showOtherTools}
          aria-controls="other-provider-tools"
          className="flex w-full items-center justify-between gap-3 text-left"
          onClick={() => setShowOtherTools((open) => !open)}
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone-100"><Wrench className="h-5 w-5 text-stone-500" /></span>
            <span>
              <span className="block font-semibold text-stone-950">Other Tools</span>
              <span className="block text-sm text-stone-500">Manual entry and more providers</span>
            </span>
          </span>
          <ChevronDown className={`h-5 w-5 shrink-0 text-stone-500 transition-transform ${showOtherTools ? "rotate-180" : ""}`} />
        </button>

        {showOtherTools ? (
          <div id="other-provider-tools" className="mt-4 space-y-2 border-t border-stone-200 pt-4">
            {otherProviders.map((provider) => (
              <div key={provider.provider} className="rounded-2xl bg-stone-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-stone-950">{provider.label}</p>
                    <p className="mt-0.5 text-xs leading-5 text-stone-500">{provider.detail}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${provider.status === "manual" ? "bg-emerald-50 text-emerald-800" : "bg-stone-200 text-stone-600"}`}>
                    {provider.status === "manual" ? "available" : "coming soon"}
                  </span>
                </div>
                {provider.provider === "manual" ? (
                  <Button variant="outline" size="sm" className="mt-3 w-full rounded-full border-stone-300 bg-white" onClick={() => handleFreeProvider("manual")}>Add a run manually</Button>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};
