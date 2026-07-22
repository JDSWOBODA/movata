import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Bookmark, CalendarCheck2, Check, DollarSign, FileUp, Pencil, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProviderGrid } from "@/components/movata/ProviderGrid";
import { HeatMap } from "@/components/movata/HeatMap";
import { Logo } from "@/components/movata/Logo";
import { product } from "@/lib/brand";
import { demoActivities, demoProfile, demoStreak } from "@/lib/sample-data";

const goals = {
  spotlight: {
    label: "Spotlight a past run",
    title: "Start with a run worth celebrating.",
    copy: "Create your page, connect your activities, and choose the race, adventure, or hard-won effort you want people to see first.",
    icon: Trophy,
  },
  "bucket-list": {
    label: "Build a Bucket List",
    title: "Start with what is calling you next.",
    copy: "Create your page, then save an UltraSignup.com race or share an event you have already registered to run.",
    icon: Bookmark,
  },
  streak: {
    label: "Share a movement streak",
    title: "Start with the way you keep showing up.",
    copy: "Create your page, choose running, hiking, biking, walking, or a custom activity, and define the streak rules that fit you.",
    icon: CalendarCheck2,
  },
} as const;

type GoalKey = keyof typeof goals;

const Onboarding = () => {
  const [searchParams] = useSearchParams();
  const requestedIntent = searchParams.get("intent");
  const intent: GoalKey = requestedIntent && requestedIntent in goals ? requestedIntent as GoalKey : "spotlight";
  const goal = goals[intent];
  const GoalIcon = goal.icon;

  return (
  <main className="min-h-screen bg-[#fbfaf6] text-stone-950">
    <header className="border-b border-stone-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Logo />
        <Button asChild variant="ghost" className="rounded-full"><Link to="/login">Already have an account?</Link></Button>
      </div>
    </header>
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {intent === "streak" ? (
        <div className="mb-8">
          <HeatMap
            activities={demoActivities}
            longestStart={demoStreak.longestStreakStart}
            longestEnd={demoStreak.longestStreakEnd}
            currentStart={demoStreak.currentStreakStart}
            unit={demoProfile.preferredUnit}
          />
        </div>
      ) : null}
      <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr]">
        <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8 lg:sticky lg:top-24 lg:h-fit">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><GoalIcon className="h-6 w-6" /></div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">{goal.label}</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">{goal.title}</h1>
          <p className="mt-4 leading-7 text-stone-500">{goal.copy}</p>
          <div className="mt-6 space-y-3 text-sm text-stone-600">
            {["Reserve your public page", "Connect or import your activities", "Choose what to feature and what stays private", "Share one memorable link"].map((step) => (
              <p key={step} className="flex items-center gap-3"><Check className="h-4 w-4 text-emerald-700" />{step}</p>
            ))}
          </div>
          <div className="mt-7 border-t border-stone-200 pt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Choose a different starting point</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(goals).map(([key, item]) => (
                <Button key={key} asChild size="sm" variant={intent === key ? "default" : "outline"} className={intent === key ? "rounded-full bg-emerald-700 text-white hover:bg-emerald-800" : "rounded-full border-stone-300 bg-white"}>
                  <Link to={`/onboarding?intent=${key}`}>{item.label}</Link>
                </Button>
              ))}
            </div>
          </div>
        </section>
        <section className="space-y-6">
          <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Step 1</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Reserve your profile URL</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <Label htmlFor="username">Username</Label>
                <div className="mt-2 flex rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 focus-within:ring-2 focus-within:ring-emerald-700">
                  <span className="py-2 text-stone-500">{product.domain}/</span>
                  <Input id="username" defaultValue="dylan" className="border-0 bg-transparent shadow-none focus-visible:ring-0" />
                </div>
                <p className="mt-2 text-sm text-emerald-700">dylan is available in the demo environment.</p>
              </div>
              <Button asChild className="rounded-full bg-emerald-700 text-white hover:bg-emerald-800"><Link to="/login">Continue <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Step 2</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Pick your first data source</h2>
            <p className="mt-2 leading-7 text-stone-500">Strava is the first direct integration and will require the {product.annualPrice} paywall before OAuth. CSV import and manual entry remain free.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 p-4"><DollarSign className="h-5 w-5 text-emerald-700" /><h3 className="mt-3 font-semibold">Strava sync</h3><p className="mt-1 text-sm text-stone-600">Paid direct import</p></div>
              <div className="rounded-[1.25rem] border border-stone-200 bg-white p-4"><FileUp className="h-5 w-5 text-emerald-700" /><h3 className="mt-3 font-semibold">CSV import</h3><p className="mt-1 text-sm text-stone-600">Free universal fallback</p></div>
              <div className="rounded-[1.25rem] border border-stone-200 bg-white p-4"><Pencil className="h-5 w-5 text-emerald-700" /><h3 className="mt-3 font-semibold">Manual run</h3><p className="mt-1 text-sm text-stone-600">Add one run quickly</p></div>
            </div>
          </div>
          <ProviderGrid />
        </section>
      </div>
    </div>
  </main>
  );
};

export default Onboarding;
