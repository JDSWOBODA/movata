import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, CalendarCheck2, CheckCircle2, ChevronRight, Globe2, ShieldCheck, Sparkles, Trophy, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SiteHeader } from "@/components/runstory/SiteHeader";
import { HeatMap } from "@/components/runstory/HeatMap";
import { RunCard } from "@/components/runstory/RunCard";
import { ProviderGrid } from "@/components/runstory/ProviderGrid";
import { StatCard } from "@/components/runstory/StatCard";
import { communityProfiles, demoActivities, demoProfile, demoRecords, demoStreak, demoTotals, specialRuns } from "@/lib/sample-data";
import { product } from "@/lib/brand";
import { formatDistance } from "@/lib/format";

const HeroPreview = () => (
  <div className="relative mx-auto max-w-xl lg:max-w-none">
    <div className="absolute -right-3 -top-6 h-28 w-28 rounded-full bg-emerald-200/50 blur-3xl" />
    <div className="relative rounded-[2rem] border border-stone-200 bg-white p-4 shadow-2xl shadow-stone-950/10 sm:p-5">
      <div className="rounded-[1.5rem] bg-[#f4f1e8] p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Public profile</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-stone-950">Maya Chen</h2>
          </div>
          <Badge className="rounded-full bg-emerald-700 text-white hover:bg-emerald-700">Live demo</Badge>
        </div>
        <div className="mt-5 grid grid-cols-[1fr_.8fr] gap-3">
          <div className="rounded-[1.25rem] bg-emerald-700 p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-50/75">Current streak</p>
            <p className="mt-2 font-mono text-7xl font-semibold leading-none tracking-[-0.08em]">{demoStreak.currentStreakDays}</p>
            <p className="mt-2 text-emerald-50">consecutive days</p>
          </div>
          <div className="space-y-3">
            <StatCard label="Longest" value={demoStreak.longestStreakDays} detail="days" />
            <StatCard label="Weekly avg" value={demoTotals.averageWeeklyMiles} detail="mi/week" />
          </div>
        </div>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-[1.25rem] border border-stone-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Fastest 5K</p>
          <p className="mt-2 font-mono text-3xl font-semibold text-stone-950">19:02</p>
          <p className="mt-1 text-sm text-stone-500">Prospect Park tune-up</p>
        </div>
        <div className="rounded-[1.25rem] border border-stone-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Longest run</p>
          <p className="mt-2 font-mono text-3xl font-semibold text-stone-950">26.2 mi</p>
          <p className="mt-1 text-sm text-stone-500">First marathon finish</p>
        </div>
      </div>
      <div className="mt-4 overflow-hidden rounded-[1.25rem] border border-stone-200 p-3">
        <div className="grid grid-cols-[repeat(14,minmax(0,1fr))] gap-1">
          {Array.from({ length: 98 }, (_, index) => (
            <span key={index} className={`h-3 rounded-[4px] ${index % 9 === 0 ? "bg-stone-100" : index % 5 === 0 ? "bg-emerald-200" : index % 4 === 0 ? "bg-emerald-500" : "bg-emerald-700"}`} />
          ))}
        </div>
      </div>
    </div>
  </div>
);

const Index = () => {
  return (
    <main className="min-h-screen bg-[#fbfaf6] text-stone-950">
      <SiteHeader />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/assets/runstory-route-texture.png')] bg-cover bg-center opacity-[0.11]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.02fr_.98fr] lg:items-center lg:px-8">
          <div>
            <Badge className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-800 hover:bg-emerald-50">{product.tagline}</Badge>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-[-0.06em] text-stone-950 sm:text-6xl lg:text-7xl">
              Your running history deserves more than a feed.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600 sm:text-xl">
              Connect your running apps, track your streak, celebrate your best miles, and create a public page that tells your complete running story.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-full bg-emerald-700 px-6 text-white hover:bg-emerald-800">
                <Link to="/onboarding">Create Your Run Page <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full border-stone-300 bg-white px-6">
                <Link to="/maya">Explore Runner Profiles</Link>
              </Button>
            </div>
            <div className="mt-8 grid max-w-2xl grid-cols-3 gap-3">
              <StatCard label="Demo streak" value={`${demoStreak.currentStreakDays}+`} detail="days" />
              <StatCard label="Total runs" value="1,458" detail="imported" />
              <StatCard label="Avg week" value="42.6" detail="miles" />
            </div>
          </div>
          <HeroPreview />
        </div>
      </section>

      <section className="border-y border-stone-200 bg-white py-8">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:grid-cols-3 sm:px-6 lg:px-8">
          {[
            [CalendarCheck2, "Streaks that respect your rules", "Any run, 1 mile, 1 kilometer, custom distance, or custom duration."],
            [BarChart3, "Statistics with editorial clarity", "Fastest runs, longest efforts, weekly mileage, records, and milestones."],
            [ShieldCheck, "Private by default where it matters", "Hide start times, heart-rate data, route endpoints, and individual activities."],
          ].map(([Icon, title, copy]) => (
            <div key={String(title)} className="rounded-[1.5rem] border border-stone-200 bg-[#fbfaf6] p-5">
              <Icon className="h-6 w-6 text-emerald-700" />
              <h3 className="mt-4 font-semibold text-stone-950">{String(title)}</h3>
              <p className="mt-2 text-sm leading-6 text-stone-500">{String(copy)}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">How it works</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight text-stone-950">A beautiful page in three honest steps.</h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["01", "Connect your apps", "Strava is the first direct integration behind a $3/year sync unlock. CSV and manual entry keep RunStory usable for everyone."],
            ["02", "Choose your highlights", "Mark favorites, races, scenic miles, tough days, and featured runs. Hide anything that should stay private."],
            ["03", "Share your running story", `Publish a custom URL like ${product.domain}/maya with Open Graph metadata and share-card graphics.`],
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
          <Button asChild variant="outline" className="rounded-full border-stone-300 bg-white"><Link to="/maya">Open full demo <ChevronRight className="ml-1 h-4 w-4" /></Link></Button>
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
              <Sparkles className="h-8 w-8 text-emerald-300" />
              <h2 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">Create a home for every mile.</h2>
              <p className="mt-4 max-w-2xl text-stone-300">RunStory keeps the MVP focused: public profile links, share tools, downloadable milestone cards, and profile discovery — without a distracting social feed.</p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button asChild className="rounded-full bg-white text-stone-950 hover:bg-stone-100"><Link to="/onboarding">Create Your Run Page</Link></Button>
                <Button asChild variant="outline" className="rounded-full border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"><Link to="/dashboard">View dashboard scaffold</Link></Button>
              </div>
            </div>
            <div className="rounded-[1.5rem] bg-white/8 p-5">
              {["Public profile links", "Native share + copy link", "Open Graph profile metadata", "Downloadable milestone cards"].map((item) => (
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
