import { Link } from "react-router-dom";
import { ArrowRight, Bookmark, CalendarCheck2, CheckCircle2, ChevronRight, Sparkles, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SiteHeader } from "@/components/movata/SiteHeader";
import { HeatMap } from "@/components/movata/HeatMap";
import { RunCard } from "@/components/movata/RunCard";
import { ProviderGrid } from "@/components/movata/ProviderGrid";
import { StatCard } from "@/components/movata/StatCard";
import { communityProfiles, demoActivities, demoProfile, demoRecords, demoStreak, demoTotals, specialRuns } from "@/lib/sample-data";
import { product } from "@/lib/brand";
import { formatDistance } from "@/lib/format";

const HeroPreview = () => (
  <Link to="/dylan" aria-label="Explore Dylan Rivera's public running profile" className="group relative mx-auto block w-full max-w-xl lg:max-w-none">
    <div className="relative min-h-[540px] overflow-hidden rounded-[2rem] border border-stone-200 bg-stone-900 shadow-2xl shadow-stone-950/15 sm:min-h-[620px]">
      <img
        src="/assets/movata-hero-runner.png"
        alt="Runner moving along a mountain road at dawn"
        className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]"
        loading="eager"
        fetchPriority="high"
      />
      <div className="absolute left-4 top-4 rounded-full border border-white/20 bg-stone-950/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white backdrop-blur sm:left-6 sm:top-6">
        Dylan's spotlight
      </div>
      <div className="absolute left-4 top-16 rounded-[1.25rem] bg-[#fbfaf6] p-4 text-stone-950 shadow-xl sm:left-6 sm:top-[4.75rem]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">Celebrated</p>
        <p className="mt-1 flex items-center gap-2 font-semibold"><Trophy className="h-5 w-5 text-amber-600" /> First ultra</p>
      </div>
      <div className="absolute inset-x-4 bottom-4 rounded-[1.5rem] border border-white/20 bg-stone-950/85 p-5 text-white shadow-2xl backdrop-blur-md sm:inset-x-6 sm:bottom-6 sm:p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">Run spotlight · September 2024</p>
            <h2 className="mt-3 max-w-md text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">The day I found out how far I could go.</h2>
          </div>
          <ArrowRight className="mb-2 h-6 w-6 shrink-0 text-amber-200 transition-transform group-hover:translate-x-1" />
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/15 pt-4">
          <div><p className="text-[10px] uppercase tracking-[0.16em] text-stone-400">Race</p><p className="mt-1 text-sm font-semibold sm:text-base">Canyon 50K</p></div>
          <div><p className="text-[10px] uppercase tracking-[0.16em] text-stone-400">Distance</p><p className="mt-1 font-mono text-lg font-semibold tabular-nums">31.1 mi</p></div>
          <div><p className="text-[10px] uppercase tracking-[0.16em] text-stone-400">Finish</p><p className="mt-1 font-mono text-lg font-semibold tabular-nums">6:42:18</p></div>
        </div>
      </div>
    </div>
  </Link>
);

const Index = () => {
  return (
    <main className="min-h-screen bg-[#fbfaf6] text-stone-950">
      <SiteHeader />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/assets/movata-route-texture.png')] bg-cover bg-center opacity-[0.11]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.02fr_.98fr] lg:items-center lg:px-8">
          <div>
            <Badge className="rounded-full bg-amber-50 px-3 py-1 text-amber-900 hover:bg-amber-50">A home for the runs that matter</Badge>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-[-0.06em] text-stone-950 sm:text-6xl lg:text-7xl">
              Put your best runs in the spotlight.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600 sm:text-xl">
              Pick the races, adventures, and hard-won miles you are proud of. Turn them into a personal page built to celebrate where you have been—and where you are going next.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-full bg-emerald-700 px-6 text-white hover:bg-emerald-800">
                <Link to="/onboarding?intent=spotlight">Spotlight a Past Run <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full border-stone-300 bg-white px-6">
                <a href="#story-builder">See What You Can Share</a>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-stone-600">
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-700" /> Celebrate past efforts</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-700" /> Save future goals</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-700" /> Share any movement streak</span>
            </div>
          </div>
          <HeroPreview />
        </div>
      </section>

      <section id="story-builder" className="border-y border-stone-200 bg-white py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-7 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Build your page your way</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">Start with one story worth sharing.</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
            <Link to="/onboarding?intent=spotlight" className="group rounded-[2rem] bg-emerald-700 p-6 text-white shadow-sm transition hover:bg-emerald-800 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15"><Trophy className="h-6 w-6" /></div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">Start here</span>
              </div>
              <p className="mt-10 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-100">Spotlight · Past runs</p>
              <h3 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">Share your favorite activities to motivate others.</h3>
              <p className="mt-4 max-w-xl leading-7 text-emerald-50">Choose a race, trail day, first finish, comeback, PR, or unforgettable adventure. Add the story behind it and feature it proudly on your page.</p>
              <span className="mt-8 inline-flex items-center font-semibold">Choose a past run <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
            </Link>
            <div className="grid gap-4">
              <Link to="/onboarding?intent=bucket-list" className="group rounded-[2rem] border border-amber-200 bg-amber-50 p-6 text-amber-950 transition hover:border-amber-300 sm:p-7">
                <div className="flex items-center justify-between"><Bookmark className="h-6 w-6 text-amber-700" /><ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" /></div>
                <p className="mt-7 text-xs font-semibold uppercase tracking-[0.22em] text-amber-800">Bucket List · Future runs</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight">Show what is calling you next.</h3>
                <p className="mt-3 text-sm leading-6 text-amber-900/75">Save races from UltraSignup.com or share events you have already signed up to run.</p>
              </Link>
              <Link to="/onboarding?intent=streak" className="group rounded-[2rem] border border-stone-200 bg-[#fbfaf6] p-6 text-stone-950 transition hover:border-emerald-300 sm:p-7">
                <div className="flex items-center justify-between"><CalendarCheck2 className="h-6 w-6 text-emerald-700" /><ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" /></div>
                <p className="mt-7 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Streaks · Any movement</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight">Keep showing up, your way.</h3>
                <p className="mt-3 text-sm leading-6 text-stone-600">Share running, hiking, biking, walking, or custom movement streaks with rules that fit you.</p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">How it works</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight text-stone-950">From one meaningful run to your whole movement story.</h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["01", "Pick a run to celebrate", "Select a past race or activity and turn the result, photos, and memory behind it into a featured Spotlight."],
            ["02", "Add what is next", "Build a Bucket List from UltraSignup.com races and events you have already registered to run."],
            ["03", "Bring in the bigger story", `Connect activities, share running or movement streaks, and publish it all at a memorable URL like ${product.domain}/dylan.`],
          ].map(([number, title, copy]) => (
            <div key={number} className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
              <p className="font-mono text-sm font-semibold text-emerald-700">{number}</p>
              <h3 className="mt-5 text-2xl font-semibold tracking-tight text-stone-950">{title}</h3>
              <p className="mt-3 leading-7 text-stone-500">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <HeatMap activities={demoActivities} longestStart={demoStreak.longestStreakStart} longestEnd={demoStreak.longestStreakEnd} currentStart={demoStreak.currentStreakStart} unit={demoProfile.preferredUnit} />
      </section>

      <section className="bg-white py-16" id="integrations">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Supported services</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-tight text-stone-950">Direct sync where possible. CSV everywhere else.</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-stone-500">Unavailable providers are clearly labeled Coming Soon and never simulated as active connections.</p>
          </div>
          <ProviderGrid />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Example profile preview</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight text-stone-950">Credible enough to share. Personal enough to keep.</h2>
          </div>
          <Button asChild variant="outline" className="rounded-full border-stone-300 bg-white"><Link to="/dylan">Open full demo <ChevronRight className="ml-1 h-4 w-4" /></Link></Button>
        </div>
        <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
          <div className="flex gap-4 overflow-x-auto pb-3 lg:grid lg:grid-cols-2 lg:overflow-visible">
            {specialRuns.slice(0, 4).map((run) => <RunCard key={run.id} activity={run} unit="mi" />)}
          </div>
          <div className="space-y-4">
            <div className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Annual goal</p>
              <div className="mt-4 flex items-end justify-between"><p className="font-mono text-4xl font-semibold">{demoTotals.annualMiles}</p><p className="text-stone-500">/ {demoTotals.annualGoalMiles} mi</p></div>
              <Progress value={(demoTotals.annualMiles / demoTotals.annualGoalMiles) * 100} className="mt-4 h-3 rounded-full" />
            </div>
            <div className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Records</p>
              {demoRecords.slice(0, 4).map((record) => (
                <div key={record.label} className="mt-3 flex items-center justify-between rounded-2xl bg-stone-50 p-3"><span className="font-semibold">{record.label}</span><span className="font-mono text-lg font-semibold text-emerald-800">{record.value}</span></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-stone-200 bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Community profiles</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight text-stone-950">Built for new runners, streak athletes, marathoners, trail people, and casual weekly miles.</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {communityProfiles.map((profile) => (
              <div key={profile.name} className="rounded-[1.5rem] border border-stone-200 bg-[#fbfaf6] p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-700 text-lg font-semibold text-white">{profile.name[0]}</div>
                <p className="mt-4 font-semibold text-stone-950">{profile.name}</p>
                <p className="text-sm text-emerald-800">{profile.type}</p>
                <p className="mt-3 text-sm leading-6 text-stone-500">{profile.detail}</p>
                <div className="mt-4 flex items-center gap-2 text-sm text-stone-500"><Trophy className="h-4 w-4 text-emerald-700" />{profile.streak} day streak</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] bg-stone-950 p-6 text-white sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_340px] lg:items-center">
            <div>
              <Sparkles className="h-8 w-8 text-amber-300" />
              <h2 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">Give the miles that changed you a place to live.</h2>
              <p className="mt-4 max-w-2xl text-stone-300">Begin with one past run, add the races ahead, then bring in the streaks and everyday movement that connect the whole story.</p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button asChild className="rounded-full bg-white text-stone-950 hover:bg-stone-100"><Link to="/onboarding?intent=spotlight">Spotlight a Past Run</Link></Button>
                <Button asChild variant="outline" className="rounded-full border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"><Link to="/dylan">Explore Dylan's page</Link></Button>
              </div>
            </div>
            <div className="rounded-[1.5rem] bg-white/8 p-5">
              {["Past-run Spotlights", "Future-race Bucket Lists", "Running, hiking, and biking streaks", "One shareable public page"].map((item) => (
                <p key={item} className="flex items-center gap-3 border-b border-white/10 py-3 last:border-0"><CheckCircle2 className="h-5 w-5 text-emerald-300" />{item}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-stone-200 px-4 py-8 text-sm text-stone-500 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p>{product.name} — {product.tagline}</p>
          <p>{formatDistance(demoTotals.totalDistanceMeters, "mi", 0)} represented in demo data.</p>
        </div>
      </footer>
    </main>
  );
};

export default Index;
