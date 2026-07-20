import { CheckCircle2, Clock, Lock, Upload } from "lucide-react";
import { providerCatalog } from "@/lib/provider-adapters";
import { Button } from "@/components/ui/button";

const iconFor = (status: string) => {
  if (status === "active") return <Upload className="h-5 w-5 text-emerald-700" />;
  if (status === "manual") return <CheckCircle2 className="h-5 w-5 text-emerald-700" />;
  if (status === "paywalled") return <Lock className="h-5 w-5 text-emerald-700" />;
  return <Clock className="h-5 w-5 text-stone-400" />;
};

export const ProviderGrid = () => (
  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    {providerCatalog.map((provider) => (
      <div key={provider.provider} className="rounded-[1.25rem] border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100">{iconFor(provider.status)}</span>
            <div>
              <h3 className="font-semibold text-stone-950">{provider.label}</h3>
              <p className="text-sm text-stone-500">{provider.detail}</p>
            </div>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${provider.status === "coming_soon" ? "bg-stone-100 text-stone-500" : "bg-emerald-50 text-emerald-800"}`}>
            {provider.status === "paywalled" ? "$3/yr" : provider.status.replace("_", " ")}
          </span>
        </div>
        <Button disabled={provider.status === "coming_soon"} variant={provider.status === "coming_soon" ? "outline" : "secondary"} className="mt-4 w-full rounded-full">
          {provider.status === "coming_soon" ? "Coming Soon — Import CSV" : provider.status === "paywalled" ? "Unlock Strava Sync" : "Start"}
        </Button>
      </div>
    ))}
  </div>
);
