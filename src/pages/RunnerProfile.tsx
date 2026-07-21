import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Copy, Download, Globe2, Lock, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/movata/Logo";
import { ProfileHero } from "@/components/movata/ProfileHero";
import { HeatMap } from "@/components/movata/HeatMap";
import { RunCard } from "@/components/movata/RunCard";
import { StatCard } from "@/components/movata/StatCard";
import { demoActivities, demoMilestones, demoProfile, demoRecords, demoStreak, specialRuns } from "@/lib/sample-data";
import { findLikelyDuplicates } from "@/lib/duplicates";
import { formatDistance } from "@/lib/format";
import { product } from "@/lib/brand";

const featured = specialRuns.filter((run) => run.highlightTypes?.includes("featured"));
const favorites = specialRuns.filter((run) => run.highlightTypes?.includes("favorite"));
const fastest = [...specialRuns].sort((a, b) => (a.averagePaceSecondsPerKm ?? 999) - (b.averagePaceSecondsPerKm ?? 999)).slice(0, 3);
const longest = [...specialRuns].sort((a, b) => b.distanceMeters - a.distanceMeters).slice(0, 3);
const latest = demoActivities.filter((run) => run.privacy === "public").slice(0, 5);

const SectionHeader = ({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) => (
  <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950">{title}</h2>
    </div>
    <p className="max-w-xl text-sm leading-6 text-stone-500">{copy}</p>
  </div>
);

const setSocialMeta = (property: string, content: string) => {
  let element = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("property", property);
    document.head.appendChild(element);
  }
  element.content = content;
};

const RunnerProfile = () => {
  const { username } = useParams();
  const isKnownProfile = !username || username === demoProfile.username;
  const duplicates = findLikelyDuplicates(specialRuns);

  useEffect(() => {
    const title = isKnownProfile ? `${demoProfile.displayName}'s running story · ${product.name}` : `Runner not found · ${product.name}`;
    const description = isKnownProfile
      ? `${demoProfile.displayName} has run for ${demoStreak.currentStreakDays} consecutive days. Explore favorite runs, records, and milestones.`
      : `This ${product.name} runner profile could not be found.`;
    document.title = title;
    setSocialMeta("og:title", title);
    setSocialMeta("og:description", description);
    setSocialMeta("og:type", "profile");
    setSocialMeta("og:url", window.location.href);
  }, [isKnownProfile]);

  const copyProfileLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Profile link copied");
  };

  const shareProfile = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${demoProfile.displayName}'s running story`,
          text: `${demoProfile.displayName} has run for ${demoStreak.currentStreakDays} consecutive days.`,
          url: window.location.href,
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    await copyProfileLink();
  };

  const downloadShareCard = () => {
    const date = new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(new Date());
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080"><rect width="1080" height="1080" rx="72" fill="#fbfaf6"/><path d="M80 190 C240 90 360 280 510 180 S820 80 1000 200" fill="none" stroke="#a7f3d0" stroke-width="12" stroke-linecap="round"/><text x="80" y="110" fill="#047857" font-family="Arial, sans-serif" font-size="34" font-weight="700">${product.name}</text><text x="80" y="410" fill="#57534e" font-family="Arial, sans-serif" font-size="42">CURRENT STREAK</text><text x="65" y="690" fill="#065f46" font-family="Arial, sans-serif" font-size="300" font-weight="700">${demoStreak.currentStreakDays}</text><text x="80" y="785" fill="#1c1917" font-family="Arial, sans-serif" font-size="68" font-weight="700">consecutive days</text><text x="80" y="920" fill="#1c1917" font-family="Arial, sans-serif" font-size="46" font-weight="700">${demoProfile.displayName}</text><text x="80" y="980" fill="#78716c" font-family="Arial, sans-serif" font-size="32">${date} · Every run adds to the story.</text></svg>`;
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${demoProfile.username}-${demoStreak.currentStreakDays}-day-streak.svg`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Share card downloaded");
  };

  if (!isKnownProfile) {
    return (
      <main className="min-h-screen bg-[#fbfaf6] px-4 py-8">
        <div className="mx-auto max-w-2xl rounded-[2rem] border border-stone-200 bg-white p-8 text-center shadow-sm">
          <Logo className="justify-center" />
          <div className="mx-auto mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-stone-100"><Globe2 className="h-7 w-7 text-stone-400" /></div>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-stone-950">Runner not found</h1>
          <p className="mt-3 text-stone-500">No public Movata profile exists for @{username}. Create your own memorable URL before it is taken.</p>
          <Button asChild className="mt-6 rounded-full bg-emerald-700 text-white hover:bg-emerald-800"><Link to="/onboarding">Reserve your profile URL</Link></Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbfaf6] text-stone-950">
      <div className="border-b border-stone-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Logo />
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="hidden rounded-full sm:inline-flex" onClick={() => void copyProfileLink()}><Copy className="mr-2 h-4 w-4" />Copy link</Button>
            <Button className="rounded-full bg-emerald-700 text-white hover:bg-emerald-800" onClick={() => void shareProfile()}><Share2 className="mr-2 h-4 w-4" />Share</Button>
          </div>
        </div>
      </div>

      <ProfileHero profile={demoProfile} streak={demoStreak} />

      <div className="mx-auto max-w-7xl space-y-12 px-4 py-10 sm:px-6 lg:px-8">
        <HeatMap
          activities={demoActivities}
          longestStart={demoStreak.longestStreakStart}
          longestEnd={demoStreak.longestStreakEnd}
          currentStart={demoStreak.currentStreakStart}
          unit={demoProfile.preferredUnit}
        />

        <section>
          <SectionHeader eyebrow="Run highlights" title="The miles Maya wants you to see first" copy="Favorite, fastest, longest, scenic, and personal-record runs are intentionally separated so the profile feels curated instead of feed-like." />
          <div className="flex gap-4 overflow-x-auto pb-3 lg:grid lg:grid-cols-3 lg:overflow-visible">
            {featured.map((activity) => <RunCard key={activity.id} activity={activity} unit={demoProfile.preferredUnit} />)}
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-3">
          <section className="lg:col-span-2">
            <SectionHeader eyebrow="Latest activity" title="Recent runs" copy="Precise start times and sensitive route endpoints are hidden by default for public viewers." />
            <div className="grid gap-3">
              {latest.map((activity) => <RunCard key={activity.id} activity={activity} unit={demoProfile.preferredUnit} compact />)}
            </div>
          </section>
          <aside className="space-y-5">
            <div className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Personal records</p>
              <div className="mt-4 space-y-3">
                {demoRecords.map((record) => (
                  <div key={record.label} className="flex items-center justify-between gap-4 rounded-2xl bg-stone-50 p-3">
                    <div><p className="font-semibold text-stone-950">{record.label}</p><p className="text-xs text-stone-500">{record.detail}</p></div>
                    <p className="font-mono text-xl font-semibold tabular-nums text-emerald-800">{record.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Privacy</p>
              <div className="mt-4 space-y-3 text-sm text-stone-600">
                <p className="flex items-center gap-2"><Lock className="h-4 w-4 text-emerald-700" /> Start times hidden</p>
                <p className="flex items-center gap-2"><Lock className="h-4 w-4 text-emerald-700" /> Home-area route segments hidden</p>
                <p className="flex items-center gap-2"><Lock className="h-4 w-4 text-emerald-700" /> Heart-rate data optional</p>
              </div>
            </div>
          </aside>
        </div>

        <section>
          <SectionHeader eyebrow="Compare chapters" title="Favorite, fastest, longest, scenic" copy="Each collection can be manually curated, confirmed, hidden, or featured from the private dashboard." />
          <div className="grid gap-5 lg:grid-cols-3">
            <div><h3 className="mb-3 font-semibold text-stone-950">Favorite Runs</h3><div className="space-y-3">{favorites.map((run) => <RunCard key={run.id} activity={run} compact />)}</div></div>
            <div><h3 className="mb-3 font-semibold text-stone-950">Fastest Runs</h3><div className="space-y-3">{fastest.map((run) => <RunCard key={run.id} activity={run} compact />)}</div></div>
            <div><h3 className="mb-3 font-semibold text-stone-950">Longest Runs</h3><div className="space-y-3">{longest.map((run) => <RunCard key={run.id} activity={run} compact />)}</div></div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[.85fr_1.15fr]">
          <div className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Streak details</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <StatCard label="Active days" value={demoStreak.activeRunningDays} />
              <StatCard label="Rest days" value={demoStreak.restDays} />
              <StatCard label="Current streak runs" value={demoStreak.currentStreakRuns} />
              <StatCard label="Streak distance" value={formatDistance(demoStreak.currentStreakDistanceMeters, "mi", 0)} />
            </div>
            <p className="mt-4 text-sm leading-6 text-stone-500">A qualifying day is one completed run of at least one mile in Maya’s home time zone. Planned workouts are not counted unless imported as completed activities.</p>
          </div>
          <div className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Running timeline</p>
            <div className="mt-5 space-y-5">
              {demoMilestones.map((milestone, index) => (
                <div key={milestone.title} className="grid grid-cols-[72px_1fr] gap-4">
                  <p className="font-mono text-sm font-semibold text-emerald-800">{milestone.date}</p>
                  <div className="relative border-l border-stone-200 pb-5 pl-5">
                    <span className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-emerald-700" />
                    <h3 className="font-semibold text-stone-950">{milestone.title}</h3>
                    <p className="mt-1 text-sm text-stone-500">{milestone.detail}</p>
                    {index === demoMilestones.length - 1 ? null : <Separator className="mt-5" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-stone-200 bg-stone-950 p-6 text-white shadow-sm sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-center">
            <div>
              <Badge className="rounded-full bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/15">Share cards</Badge>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Turn milestones into graphics worth posting.</h2>
              <p className="mt-3 max-w-2xl text-stone-300">Generate portrait, square, and landscape cards for streak anniversaries, annual mileage, race results, personal records, and longest runs.</p>
              <Button className="mt-5 rounded-full bg-white text-stone-950 hover:bg-stone-100" onClick={downloadShareCard}><Download className="mr-2 h-4 w-4" />Download sample card</Button>
            </div>
            <div className="rounded-[1.5rem] bg-[#fbfaf6] p-5 text-stone-950">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">{product.name}</p>
              <p className="mt-8 text-lg text-stone-500">Current streak</p>
              <p className="font-mono text-7xl font-semibold tracking-[-0.08em] text-emerald-800">{demoStreak.currentStreakDays}</p>
              <p className="text-xl font-semibold">consecutive days</p>
              <p className="mt-8 text-sm text-stone-500">Maya Chen · {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </section>

        {duplicates.length ? (
          <div className="rounded-[1.25rem] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Duplicate activity detected: {duplicates[0].reasons.join(", ")}. The dashboard will ask the runner to merge or keep both.
          </div>
        ) : null}
      </div>

      <div className="sticky bottom-3 z-30 mx-auto mb-3 flex w-[calc(100%-1.5rem)] max-w-md justify-center rounded-full border border-stone-200 bg-white/95 p-2 shadow-lg backdrop-blur sm:hidden">
        <Button className="flex-1 rounded-full bg-emerald-700 text-white hover:bg-emerald-800" onClick={() => void shareProfile()}><Share2 className="mr-2 h-4 w-4" />Share Maya’s profile</Button>
      </div>
    </main>
  );
};

export default RunnerProfile;
