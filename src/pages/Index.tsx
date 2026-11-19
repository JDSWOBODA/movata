import { Link } from "react-router-dom";
import { ArrowRight, Bookmark, CheckCircle2, Link2, Trophy, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/movata/SiteHeader";
import { product } from "@/lib/brand";

const HeroPreview = () => (
  <div className="relative mx-auto hidden min-h-[590px] w-full overflow-hidden rounded-[2rem] border border-stone-200 bg-stone-900 shadow-2xl shadow-stone-950/15 lg:block">
    <img
      src="/assets/movata-hero-runner.png"
      alt="Runner moving along a mountain road at dawn"
      className="absolute inset-0 h-full w-full object-cover"
      loading="eager"
      fetchPriority="high"
    />
    <div className="absolute left-6 top-6 rounded-full border border-white/20 bg-stone-950/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white backdrop-blur">
      Dylan’s Movata
    </div>
    <div className="absolute inset-x-6 bottom-6 rounded-[1.5rem] border border-white/15 bg-stone-950/88 p-6 text-white shadow-2xl backdrop-blur-md">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">A profile built around what matters</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-white/10 p-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-amber-200"><Trophy className="h-4 w-4" /> Completed spotlight</p>
          <p className="mt-3 text-xl font-semibold">Canyon 50K</p>
          <p className="mt-1 text-sm text-stone-300">First ultra · 31.1 miles</p>
        </div>
        <div className="rounded-2xl bg-white/10 p-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-emerald-200"><Bookmark className="h-4 w-4" /> Bucket list</p>
          <p className="mt-3 text-xl font-semibold">Leadville Trail 100</p>
          <p className="mt-1 text-sm text-stone-300">Dream race · Leadville, CO</p>
        </div>
      </div>
    </div>
  </div>
);

const steps = [
  {
    number: "01",
    title: "Create your free profile",
    copy: "Claim a memorable Movata page and decide what you want the world to see.",
  },
  {
    number: "02",
    title: "Connect Strava",
    copy: "Bring in your activity history securely, or start with a free CSV import.",
  },
  {
    number: "03",
    title: "Choose what matters",
    copy: "Spotlight meaningful completed activities and add the races still on your Bucket List.",
  },
];

const Index = () => (
  <main className="min-h-screen bg-[#fbfaf6] text-stone-950">
    <SiteHeader />

    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/assets/movata-route-texture.png')] bg-cover bg-center opacity-[0.08]" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.02fr_.98fr] lg:items-center lg:px-8 lg:py-24">
        <div>
          <Badge className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-900 hover:bg-emerald-50">Your running story, in one place</Badge>
          <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-stone-200 bg-stone-100 shadow-lg lg:hidden">
            <img src="/assets/movata-demo-cover.png" alt="Runner on a scenic trail" className="h-64 w-full object-cover sm:h-80" loading="eager" fetchPriority="high" />
          </div>
          <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-[-0.06em] text-stone-950 sm:text-6xl lg:text-7xl">
            Your favorite runs. Your future goals. One profile.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600 sm:text-xl">
            Create a free Movata profile, connect Strava, and turn the activities you are proud of—and the races you dream about—into a page worth sharing.
          </p>
          <Button asChild size="lg" className="mt-8 w-full rounded-full bg-emerald-700 px-7 text-white shadow-sm hover:bg-emerald-800 sm:w-auto">
            <Link to="/onboarding">Create your free profile <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
          <div className="mt-6 flex flex-col gap-2 text-sm font-medium text-stone-600 sm:flex-row sm:flex-wrap sm:gap-x-5">
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-700" /> Free account</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-700" /> You control what is public</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-700" /> Strava or CSV import</span>
          </div>
        </div>
        <HeroPreview />
      </div>
    </section>

    <section id="how-it-works" className="border-y border-stone-200 bg-white py-14 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">How it works</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">From Strava history to a story that feels like yours.</h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map((step) => (
            <article key={step.number} className="rounded-[1.75rem] border border-stone-200 bg-[#fbfaf6] p-6">
              <p className="font-mono text-sm font-semibold text-emerald-700">{step.number}</p>
              <h3 className="mt-5 text-2xl font-semibold tracking-tight text-stone-950">{step.title}</h3>
              <p className="mt-3 leading-7 text-stone-600">{step.copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Make it personal</p>
        <h2 className="mt-3 text-4xl font-semibold tracking-tight text-stone-950">Not another activity feed.</h2>
        <p className="mt-4 text-lg leading-8 text-stone-600">Movata helps people understand the moments that shaped you and the challenges pulling you forward.</p>
      </div>
      <div className="mt-9 grid gap-5 lg:grid-cols-2">
        <article className="rounded-[2rem] bg-emerald-700 p-6 text-white shadow-sm sm:p-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15"><Trophy className="h-6 w-6" /></span>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">Completed activities</p>
          <h3 className="mt-3 text-3xl font-semibold tracking-tight">Share the efforts that mean something.</h3>
          <p className="mt-4 max-w-xl leading-7 text-emerald-50">Feature a first finish, a breakthrough race, a hard comeback, or the trail day you still tell people about.</p>
        </article>
        <article className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 text-amber-950 sm:p-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-600 text-white"><Bookmark className="h-6 w-6" /></span>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-amber-800">Bucket List activities</p>
          <h3 className="mt-3 text-3xl font-semibold tracking-tight">Show what you are chasing next.</h3>
          <p className="mt-4 max-w-xl leading-7 text-amber-900/80">Keep dream events like Leadville 100 and Western States 100 beside the races already on your calendar.</p>
        </article>
      </div>
      <p className="mt-6 text-center text-sm text-stone-500">Streaks, records, consistency maps, and privacy controls are available when you want to tell more of the story.</p>
    </section>

    <section id="integrations" className="border-y border-stone-200 bg-white py-12">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Bring your activities with you</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">Start with Strava. Keep control of your data.</h2>
          <p className="mt-3 max-w-xl leading-7 text-stone-600">Create your free account first, then choose direct Strava sync or import a CSV. Nothing is published until you choose it.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5">
            <Link2 className="h-6 w-6 text-emerald-700" />
            <h3 className="mt-4 text-xl font-semibold text-stone-950">Connect Strava</h3>
            <p className="mt-2 text-sm leading-6 text-stone-600">Secure direct sync is available as an optional $3/year add-on.</p>
          </div>
          <div className="rounded-[1.5rem] border border-stone-200 bg-[#fbfaf6] p-5">
            <Upload className="h-6 w-6 text-emerald-700" />
            <h3 className="mt-4 text-xl font-semibold text-stone-950">Import a CSV</h3>
            <p className="mt-2 text-sm leading-6 text-stone-600">A free fallback for Strava exports and other activity tools.</p>
          </div>
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 lg:px-8">
      <div className="rounded-[2rem] bg-emerald-700 px-6 py-10 text-white shadow-sm sm:px-10 sm:py-12">
        <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">Build a profile around the activities that matter to you.</h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-emerald-50">Start free. Connect your history when you are ready. You decide what deserves the spotlight.</p>
        <Button asChild size="lg" className="mt-7 rounded-full bg-white px-7 text-emerald-900 hover:bg-emerald-50">
          <Link to="/onboarding">Create your free profile <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </div>
    </section>

    <footer className="border-t border-stone-200 px-4 py-8 text-sm text-stone-500 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p>{product.name} — {product.tagline}</p>
        <div className="flex gap-5"><Link to="/dylan" className="hover:text-emerald-800">Demo profile</Link><Link to="/login" className="hover:text-emerald-800">Sign in</Link><Link to="/privacy" className="hover:text-emerald-800">Privacy</Link></div>
      </div>
    </footer>
  </main>
);

export default Index;
