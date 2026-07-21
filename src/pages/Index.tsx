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
  <Link to="/maya" aria-label="Explore Maya Chen's public running profile" className="group relative mx-auto block w-full max-w-xl lg:max-w-none">
    <div className="relative min-h-[540px] overflow-hidden rounded-[2rem] border border-stone-200 bg-stone-900 shadow-2xl shadow-stone-950/15 sm:min-h-[620px]">
      <img
        src="/assets/runstory-hero-runner.png"
        alt="Runner moving along a mountain road at dawn"
        className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]"
        loading="eager"
        fetchPriority="high"
      />
      <div className="absolute left-4 top-4 rounded-full border border-white/20 bg-stone-950/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white backdrop-blur sm:left-6 sm:top-6">
        Maya's running story
      </div>
      <div className="absolute right-4 top-4 rounded-[1.25rem] bg-[#fbfaf6] p-4 text-stone-950 shadow-xl sm:right-6 sm:top-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">This week</p>
        <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">42.6 <span className="text-sm text-stone-500">mi</span></p>
      </div>
      <div className="absolute inset-x-4 bottom-4 rounded-[1.5rem] border border-white/20 bg-stone-950/85 p-5 text-white shadow-2xl backdrop-blur-md sm:inset-x-6 sm:bottom-6 sm:p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">Current streak</p>
            <div className="mt-2 flex items-end gap-3">
              <p className="font-mono text-7xl font-semibold leading-none tracking-[-0.08em] tabular-nums sm:text-8xl">{demoStreak.currentStreakDays}</p>
              <p className="pb-2 text-sm leading-5 text-stone-200 sm:text-base">consecutive<br />days</p>
            </div>
          </div>
          <ArrowRight className="mb-2 h-6 w-6 text-emerald-200 transition-transform group-hover:translate-x-1" />
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/15 pt-4">
          <div><p className="text-[10px] uppercase tracking-[0.16em] text-stone-400">Longest</p><p className="mt-1 font-mono text-lg font-semibold tabular-nums">{demoStreak.longestStreakDays}d</p></div>
          <div><p className="text-[10px] uppercase tracking-[0.16em] text-stone-400">Fastest 5K</p><p className="mt-1 font-mono text-lg font-semibold tabular-nums">19:02</p></div>
          <div><p className="text-[10px] uppercase tracking-[0.16em] text-stone-400">Lifetime</p><p className="mt-1 font-mono text-lg font-semibold tabular-nums">8,642 mi</p></div>
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
        <div className="absolute inset-0 bg-[url('/assets/runstory-route-texture.png')] bg-cover bg-center opacity-[0.11]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.02fr_.98fr] lg:items-center lg:px-8">
          <div>
            <Badge className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-800 hover:bg-emerald-50">{product.tagline}</Badge>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-[-0.06em] text-stone-950 sm:text-6xl lg:text-7xl">
              Your running story deserves more than a feed.
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
