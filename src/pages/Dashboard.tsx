import { Link } from "react-router-dom";
import { Activity, AlertTriangle, CalendarDays, CheckCircle2, FileUp, LogOut, Settings, Sparkles, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/movata/Logo";
import { ProviderGrid } from "@/components/movata/ProviderGrid";
import { RunCard } from "@/components/movata/RunCard";
import { StatCard } from "@/components/movata/StatCard";
import { useSession } from "@/contexts/SessionContext";
import { demoActivities, demoStreak, demoTotals, specialRuns } from "@/lib/sample-data";

const nav = ["Overview", "Activities", "Streak", "Highlights", "Records", "Profile Editor", "Integrations", "Settings"];

const Dashboard = () => {
  const { user, signOut } = useSession();

  return (
    <main className="min-h-screen bg-[#fbfaf6] text-stone-950">
      <header className="border-b border-stone-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Logo />
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="hidden rounded-full border-stone-300 bg-white sm:inline-flex"><Link to="/maya">View public page</Link></Button>
            <Button variant="ghost" className="rounded-full" onClick={() => void signOut()}><LogOut className="mr-2 h-4 w-4" />Sign out</Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_1fr] lg:px-8">
        <aside className="rounded-[1.5rem] border border-stone-200 bg-white p-3 shadow-sm lg:sticky lg:top-24 lg:h-fit">
          <nav className="flex gap-2 overflow-x-auto lg:flex-col" aria-label="Dashboard navigation">
            {nav.map((item, index) => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, "-")}`} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition lg:rounded-2xl ${index === 0 ? "bg-emerald-700 text-white" : "text-stone-600 hover:bg-stone-100 hover:text-stone-950"}`}>{item}</a>
            ))}
          </nav>
        </aside>

        <section className="space-y-6">
          <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
            <Badge className="rounded-full bg-emerald-50 text-emerald-800 hover:bg-emerald-50">Dashboard scaffold</Badge>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}.</h1>
            <p className="mt-3 max-w-3xl leading-7 text-stone-500">This authenticated dashboard is ready for Phase 2 and 3 work: onboarding, profile editing, CSV import, manual runs, activity management, streak settings, and provider sync status.</p>
          </div>

          <div id="overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Current streak" value={demoStreak.currentStreakDays} detail="days" tone="emerald" />
            <StatCard label="Longest streak" value={demoStreak.longestStreakDays} detail="days" />
            <StatCard label="Miles this week" value={demoTotals.milesThisWeek} detail="on pace" />
            <StatCard label="Runs this month" value="27" detail={`${demoTotals.milesThisMonth} miles`} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
            <section className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Activity manager</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">Recent runs</h2></div>
                <Button className="rounded-full bg-emerald-700 text-white hover:bg-emerald-800"><FileUp className="mr-2 h-4 w-4" />Import CSV</Button>
              </div>
              <div className="mt-5 grid gap-3">
                {demoActivities.slice(0, 4).map((activity) => <RunCard key={activity.id} activity={activity} compact />)}
              </div>
            </section>

            <aside className="space-y-6">
              <div className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Annual goal</p>
                <div className="mt-4 flex items-end justify-between"><p className="font-mono text-4xl font-semibold">{demoTotals.annualMiles}</p><p className="text-stone-500">/ {demoTotals.annualGoalMiles} mi</p></div>
                <Progress value={(demoTotals.annualMiles / demoTotals.annualGoalMiles) * 100} className="mt-4 h-3" />
              </div>
              <div className="rounded-[1.75rem] border border-stone-200 bg-amber-50 p-5 text-amber-950 shadow-sm">
                <AlertTriangle className="h-6 w-6" />
                <h3 className="mt-3 font-semibold">Duplicate activities detected</h3>
                <p className="mt-2 text-sm leading-6">A CSV import appears to overlap with a Strava long run. Merge duplicates before publishing updated stats.</p>
                <Button variant="outline" className="mt-4 rounded-full border-amber-300 bg-white">Review duplicates</Button>
              </div>
            </aside>
          </div>

          <section id="integrations" className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3"><Activity className="h-6 w-6 text-emerald-700" /><div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Integrations</p><h2 className="text-2xl font-semibold tracking-tight">Connect sources</h2></div></div>
            <ProviderGrid />
          </section>

          <section id="profile-editor" className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
              <Settings className="h-6 w-6 text-emerald-700" />
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">Profile editor scaffold</h2>
              <p className="mt-2 leading-7 text-stone-500">Display name, username, photos, bio, location, running-since date, preferred unit, theme, accent color, featured stats, social links, and visibility settings.</p>
              <Button className="mt-5 rounded-full bg-emerald-700 text-white hover:bg-emerald-800">Open editor</Button>
            </div>
            <div className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
              <Sparkles className="h-6 w-6 text-emerald-700" />
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">Suggested highlights</h2>
              <div className="mt-4 space-y-3">
                {specialRuns.slice(0, 3).map((run) => <p key={run.id} className="flex items-center gap-3 rounded-2xl bg-stone-50 p-3 text-sm"><Trophy className="h-4 w-4 text-emerald-700" />Feature “{run.title}” on profile</p>)}
              </div>
            </div>
          </section>

          <section id="settings" className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Trust controls</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {["Make profile private", "Hide exact start times", "Hide route maps", "Hide home-area segments", "Hide heart-rate data", "Delete imported data"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-stone-200 p-3"><CheckCircle2 className="h-4 w-4 text-emerald-700" />{item}</div>
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
};

export default Dashboard;
