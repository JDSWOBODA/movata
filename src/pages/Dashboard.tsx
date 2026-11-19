import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Activity, ArrowDown, ArrowUp, CalendarCheck2, Check, EyeOff, Flame, Globe2, LoaderCircle, Lock, LogOut, Medal, Pencil,
  Plus, RefreshCw, Settings, Sparkles, Star, Trash2, Unplug, UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/movata/Logo";
import { ProviderGrid } from "@/components/movata/ProviderGrid";
import { RunCard } from "@/components/movata/RunCard";
import { StatCard } from "@/components/movata/StatCard";
import { ProfileEditor } from "@/components/movata/ProfileEditor";
import { FeatureRunDialog } from "@/components/movata/FeatureRunDialog";
import { useSession } from "@/contexts/SessionContext";
import { demoActivities, demoStreak, demoTotals, streakSettings } from "@/lib/sample-data";
import { useStrava } from "@/hooks/use-strava";
import { useOwnProfile } from "@/hooks/use-profile";
import { calculateStreakSummary } from "@/lib/streaks";
import { summarizeActivities } from "@/lib/activity-stats";
import { formatDate, formatDistance, formatDuration, formatPace } from "@/lib/format";
import { blankDraft, draftFromActivity, featuredRunToActivity, type FeaturedRunInput, type FeaturedRunRow } from "@/lib/profile";
import type { NormalizedActivity } from "@/lib/movata-types";

const sections = [
  { id: "overview", label: "Overview" },
  { id: "activities", label: "Activities" },
  { id: "streak", label: "Streak" },
  { id: "highlights", label: "Highlights" },
  { id: "records", label: "Records" },
  { id: "profile-editor", label: "Profile Editor" },
  { id: "integrations", label: "Integrations" },
  { id: "settings", label: "Settings" },
] as const;

const PAGE_SIZE = 10;

const SectionTitle = ({ eyebrow, title, icon: Icon, children }: { eyebrow: string; title: string; icon: typeof Activity; children?: React.ReactNode }) => (
  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
    <div className="flex items-center gap-3">
      <Icon className="h-6 w-6 text-emerald-700" />
      <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">{eyebrow}</p><h2 className="text-2xl font-semibold tracking-tight">{title}</h2></div>
    </div>
    {children}
  </div>
);

const PrivateBadge = () => (
  <Badge variant="outline" className="rounded-full border-stone-300 text-stone-500"><Lock className="mr-1 h-3 w-3" />Only you</Badge>
);

/** Highlight the menu item for whichever section is in view. */
const useActiveSection = () => {
  const [active, setActive] = useState<string>(sections[0].id);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-15% 0px -70% 0px" },
    );
    sections.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, []);
  return [active, setActive] as const;
};

const scrollToSection = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${id}`);
};

const Dashboard = () => {
  const { user, signOut } = useSession();
  const strava = useStrava();
  const own = useOwnProfile();
  const [activeSection, setActiveSection] = useActiveSection();
  const [visibleRuns, setVisibleRuns] = useState(PAGE_SIZE);
  const [dialog, setDialog] = useState<{ mode: "add" | "edit"; draft: FeaturedRunInput; editingId?: string } | null>(null);

  // Jump to the section in the URL hash once the page has rendered (e.g. /dashboard#profile-editor).
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id && sections.some((section) => section.id === id)) window.setTimeout(() => scrollToSection(id), 150);
  }, []);

  // Real Strava runs once connected and synced; otherwise the sample data, clearly labeled.
  const usingStrava = strava.connected && strava.activities.length > 0;
  const activities = usingStrava ? strava.activities : demoActivities;
  const unit = own.profile?.preferred_unit ?? "mi";
  const streak = usingStrava
    ? calculateStreakSummary(activities, { ...streakSettings, homeTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone })
    : demoStreak;
  const totals = usingStrava
    ? { ...summarizeActivities(activities), annualGoalMiles: demoTotals.annualGoalMiles }
    : { milesThisWeek: demoTotals.milesThisWeek, milesThisMonth: demoTotals.milesThisMonth, runsThisMonth: 27, annualMiles: demoTotals.annualMiles, annualGoalMiles: demoTotals.annualGoalMiles };
  const sortedRuns = useMemo(() => [...activities].sort((a, b) => b.startedAt.localeCompare(a.startedAt)), [activities]);
  const lastSynced = strava.connection?.last_synced_at ? new Date(strava.connection.last_synced_at).toLocaleString() : null;

  const featuredStravaIds = useMemo(
    () => new Set(own.featuredRuns.map((run) => run.strava_activity_id).filter((id): id is number => id !== null).map(String)),
    [own.featuredRuns],
  );
  const isFeatured = (activity: NormalizedActivity) => Boolean(activity.externalId && featuredStravaIds.has(activity.externalId));

  const records = useMemo(() => {
    if (!sortedRuns.length) return [];
    const longest = sortedRuns.reduce((best, run) => (run.distanceMeters > best.distanceMeters ? run : best));
    const longestTime = sortedRuns.reduce((best, run) => (run.movingTimeSeconds > best.movingTimeSeconds ? run : best));
    const paced = sortedRuns.filter((run) => run.distanceMeters >= 5000 && run.averagePaceSecondsPerKm);
    const fastest = paced.length ? paced.reduce((best, run) => (run.averagePaceSecondsPerKm! < best.averagePaceSecondsPerKm! ? run : best)) : null;
    const climbs = sortedRuns.filter((run) => run.elevationGainMeters);
    const climb = climbs.length ? climbs.reduce((best, run) => (run.elevationGainMeters! > best.elevationGainMeters! ? run : best)) : null;
    return [
      { label: "Longest run", value: formatDistance(longest.distanceMeters, unit), run: longest },
      { label: "Longest time on feet", value: formatDuration(longestTime.movingTimeSeconds), run: longestTime },
      ...(fastest ? [{ label: "Fastest pace (5k+)", value: formatPace(fastest.averagePaceSecondsPerKm, unit), run: fastest }] : []),
      ...(climb ? [{ label: "Most climbing", value: `${Math.round(climb.elevationGainMeters!)} m`, run: climb }] : []),
    ];
  }, [sortedRuns, unit]);

  const suggestions = useMemo(() => {
    if (!usingStrava) return [];
    const picks = records.map((record) => record.run);
    return picks
      .filter((run, index) => picks.findIndex((other) => other.id === run.id) === index)
      .filter((run) => !(run.externalId && featuredStravaIds.has(run.externalId)))
      .slice(0, 3);
  }, [records, usingStrava, featuredStravaIds]);

  const requireProfile = () => {
    if (own.profile) return true;
    toast.info("Create your profile first so featured runs have a page to live on.");
    scrollToSection("profile-editor");
    return false;
  };

  const openFeature = (activity: NormalizedActivity) => {
    if (requireProfile()) setDialog({ mode: "add", draft: draftFromActivity(activity) });
  };
  const openManual = () => {
    if (requireProfile()) setDialog({ mode: "add", draft: blankDraft() });
  };
  const openEdit = (run: FeaturedRunRow) => {
    const { id, user_id: _userId, position: _position, ...draft } = run;
    setDialog({ mode: "edit", draft, editingId: id });
  };

  const submitDialog = (input: FeaturedRunInput) => {
    if (!dialog) return;
    const close = { onSuccess: () => setDialog(null) };
    if (dialog.mode === "edit" && dialog.editingId) own.editFeatured.mutate({ id: dialog.editingId, input }, close);
    else own.feature.mutate(input, close);
  };

  const publicPath = own.profile?.is_public ? `/${own.profile.username}` : null;

  return (
    <main className="min-h-screen bg-[#fbfaf6] text-stone-950">
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Logo />
          <div className="flex items-center gap-2">
            {publicPath ? (
              <Button asChild variant="outline" className="hidden rounded-full border-stone-300 bg-white sm:inline-flex"><Link to={publicPath}>View public page</Link></Button>
            ) : (
              <Button variant="outline" className="hidden rounded-full border-stone-300 bg-white sm:inline-flex" onClick={() => scrollToSection("profile-editor")}>Set up public page</Button>
            )}
            <Button variant="ghost" className="rounded-full" onClick={() => void signOut()}><LogOut className="mr-2 h-4 w-4" />Sign out</Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:px-8">
        <aside className="sticky top-[65px] z-20 -mx-4 min-w-0 bg-[#fbfaf6]/95 px-4 py-1 backdrop-blur lg:top-24 lg:mx-0 lg:h-fit lg:bg-transparent lg:p-0">
          <nav className="flex gap-2 overflow-x-auto rounded-[1.5rem] border border-stone-200 bg-white p-3 shadow-sm lg:flex-col" aria-label="Dashboard navigation">
            {sections.map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                aria-current={activeSection === id ? "true" : undefined}
                onClick={(event) => { event.preventDefault(); setActiveSection(id); scrollToSection(id); }}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition lg:rounded-2xl ${activeSection === id ? "bg-emerald-700 text-white" : "text-stone-600 hover:bg-stone-100 hover:text-stone-950"}`}
              >
                {label}
              </a>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 space-y-6 [&>section]:scroll-mt-28 lg:[&>section]:scroll-mt-24">
          {/* Overview */}
          <section id="overview" className="space-y-6">
            <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Welcome back{own.profile?.display_name ? `, ${own.profile.display_name.split(" ")[0]}` : user?.email ? `, ${user.email.split("@")[0]}` : ""}.</h1>
              <p className="mt-3 max-w-3xl leading-7 text-stone-500">
                Your runs stay private here. Pick the ones worth celebrating and they appear on {publicPath ? <Link to={publicPath} className="font-medium text-emerald-800 underline underline-offset-2">your public page</Link> : "your public page"}.
              </p>
            </div>

            <div className={`flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border p-4 shadow-sm ${usingStrava ? "border-[#FC5200]/30 bg-white" : "border-amber-200 bg-amber-50"}`}>
              <p className="text-sm text-stone-600">
                {usingStrava ? (
                  <><span className="font-semibold text-[#FC5200]">Powered by Strava</span> · {strava.activities.length} runs{lastSynced ? ` · last synced ${lastSynced}` : ""} · visible only to you</>
                ) : strava.connected ? (
                  <>{strava.sync.isPending ? "Pulling your runs from Strava…" : "Strava is connected. Sync to replace the sample data below."}</>
                ) : (
                  <>You're looking at <span className="font-semibold">sample data</span>. <button type="button" className="font-semibold underline underline-offset-2" onClick={() => scrollToSection("integrations")}>Connect Strava</button> to see your own runs.</>
                )}
              </p>
              {strava.connected ? (
                <Button size="sm" variant="outline" className="rounded-full bg-white" disabled={strava.sync.isPending} onClick={() => strava.sync.mutate()}>
                  {strava.sync.isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}Sync now
                </Button>
              ) : null}
            </div>
            {strava.connection?.sync_error ? <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">{strava.connection.sync_error}</p> : null}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Current streak" value={streak.currentStreakDays} detail="days" tone="emerald" />
              <StatCard label="Featured runs" value={own.featuredRuns.length} detail={own.profile ? "on your public page" : "create a profile first"} />
              <StatCard label="Miles this week" value={totals.milesThisWeek} detail="since Monday" />
              <StatCard label="Runs this month" value={totals.runsThisMonth} detail={`${totals.milesThisMonth} miles`} />
            </div>

            <div className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Annual goal</p><PrivateBadge /></div>
              <div className="mt-4 flex items-end justify-between"><p className="font-mono text-4xl font-semibold">{totals.annualMiles}</p><p className="text-stone-500">/ {totals.annualGoalMiles} mi</p></div>
              <Progress value={Math.min((totals.annualMiles / totals.annualGoalMiles) * 100, 100)} className="mt-4 h-3" />
            </div>
          </section>

          {/* Activities */}
          <section id="activities" className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
            <SectionTitle eyebrow="Activity manager" title={usingStrava ? `All runs (${sortedRuns.length})` : "Sample runs"} icon={Activity}>
              <Button className="rounded-full bg-emerald-700 text-white hover:bg-emerald-800" onClick={openManual}><Plus className="mr-2 h-4 w-4" />Add a run manually</Button>
            </SectionTitle>
            {!usingStrava ? <p className="mb-4 rounded-2xl bg-amber-50 p-3 text-sm text-amber-900">Sample runs can't be featured. Connect Strava, or add a run manually.</p> : null}
            <ul className="divide-y divide-stone-100">
              {sortedRuns.slice(0, visibleRuns).map((run) => (
                <li key={run.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{run.title}</p>
                    <p className="text-sm text-stone-500">{formatDate(run.localDate)} · {formatDistance(run.distanceMeters, unit)} · {formatDuration(run.movingTimeSeconds)} · {formatPace(run.averagePaceSecondsPerKm, unit)}</p>
                  </div>
                  {isFeatured(run) ? (
                    <Badge className="rounded-full bg-emerald-50 text-emerald-800 hover:bg-emerald-50"><Check className="mr-1 h-3 w-3" />Featured</Badge>
                  ) : (
                    <Button size="sm" variant="outline" className="rounded-full" disabled={!usingStrava} onClick={() => openFeature(run)}>
                      <Star className="mr-1.5 h-3.5 w-3.5" />Feature
                    </Button>
                  )}
                </li>
              ))}
            </ul>
            {sortedRuns.length > visibleRuns ? (
              <Button variant="ghost" className="mt-3 w-full rounded-full" onClick={() => setVisibleRuns((count) => count + PAGE_SIZE * 2)}>Show more runs</Button>
            ) : null}
          </section>

          {/* Streak */}
          <section id="streak" className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
            <SectionTitle eyebrow="Consistency" title="Your streak" icon={Flame}><PrivateBadge /></SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <StatCard label="Current streak" value={streak.currentStreakDays} detail={streak.currentStreakStart ? `since ${formatDate(streak.currentStreakStart)}` : "days"} tone="emerald" />
              <StatCard label="Longest streak" value={streak.longestStreakDays} detail={streak.longestStreakStart && streak.longestStreakEnd ? `${formatDate(streak.longestStreakStart)} – ${formatDate(streak.longestStreakEnd)}` : "days"} />
              <StatCard label="Runs in streak" value={streak.currentStreakRuns} detail={formatDistance(streak.currentStreakDistanceMeters, unit, 0)} />
              <StatCard label="Active days" value={streak.activeRunningDays} />
              <StatCard label="Rest days" value={streak.restDays} />
              <StatCard label="Daily average" value={formatDistance(streak.currentStreakAverageDailyDistanceMeters, unit)} detail="during current streak" />
            </div>
            <p className="mt-4 text-sm text-stone-500">A day counts when you log a run of at least {formatDistance(streakSettings.minimumDistanceMeters, unit)} in your local time zone.</p>
          </section>

          {/* Highlights */}
          <section id="highlights" className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
            <SectionTitle eyebrow="Public page" title="Featured runs" icon={Sparkles}>
              <Badge variant="outline" className="rounded-full border-emerald-300 text-emerald-800"><Globe2 className="mr-1 h-3 w-3" />Public</Badge>
            </SectionTitle>
            {!own.profile ? (
              <div className="rounded-2xl border border-dashed border-stone-300 p-6 text-center">
                <p className="text-stone-600">Create your profile to start featuring runs.</p>
                <Button className="mt-3 rounded-full bg-emerald-700 text-white hover:bg-emerald-800" onClick={() => scrollToSection("profile-editor")}>Create profile</Button>
              </div>
            ) : own.featuredRuns.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-300 p-6 text-center">
                <p className="text-stone-600">No featured runs yet. Pick one from <button type="button" className="font-medium underline underline-offset-2" onClick={() => scrollToSection("activities")}>your activities</button> or add one manually.</p>
              </div>
            ) : (
              <ol className="grid gap-4 md:grid-cols-2">
                {own.featuredRuns.map((run, index) => (
                  <li key={run.id} className="space-y-2">
                    <RunCard activity={featuredRunToActivity(run)} unit={unit} compact />
                    <div className="flex flex-wrap gap-1.5">
                      <Button size="sm" variant="outline" className="rounded-full" onClick={() => openEdit(run)}><Pencil className="mr-1.5 h-3.5 w-3.5" />Edit</Button>
                      <Button size="sm" variant="ghost" className="rounded-full" aria-label="Move earlier" disabled={index === 0 || own.move.isPending} onClick={() => own.move.mutate({ index, direction: -1 })}><ArrowUp className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" className="rounded-full" aria-label="Move later" disabled={index === own.featuredRuns.length - 1 || own.move.isPending} onClick={() => own.move.mutate({ index, direction: 1 })}><ArrowDown className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" className="ml-auto rounded-full text-red-700 hover:bg-red-50 hover:text-red-800" disabled={own.unfeature.isPending}
                        onClick={() => { if (window.confirm(`Remove "${run.title}" from your public page?`)) own.unfeature.mutate(run.id); }}>
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />Remove
                      </Button>
                    </div>
                  </li>
                ))}
              </ol>
            )}
            {suggestions.length && own.profile ? (
              <div className="mt-6 border-t border-stone-200 pt-5">
                <p className="text-sm font-semibold text-stone-700">Suggested from your records</p>
                <div className="mt-3 space-y-2">
                  {suggestions.map((run) => (
                    <div key={run.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-stone-50 p-3 text-sm">
                      <Medal className="h-4 w-4 text-emerald-700" />
                      <span className="min-w-0 flex-1 truncate">{run.title} · {formatDistance(run.distanceMeters, unit)} · {formatDate(run.localDate)}</span>
                      <Button size="sm" variant="outline" className="rounded-full bg-white" onClick={() => openFeature(run)}><Star className="mr-1.5 h-3.5 w-3.5" />Feature</Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          {/* Records */}
          <section id="records" className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
            <SectionTitle eyebrow="Personal bests" title="Records" icon={Medal}><PrivateBadge /></SectionTitle>
            {records.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {records.map((record) => (
                  <div key={record.label} className="flex items-center justify-between gap-3 rounded-2xl bg-stone-50 p-4">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">{record.label}</p>
                      <p className="mt-1 font-mono text-2xl font-semibold text-emerald-800">{record.value}</p>
                      <p className="truncate text-sm text-stone-500">{record.run.title} · {formatDate(record.run.localDate)}</p>
                    </div>
                    {usingStrava && !isFeatured(record.run) ? (
                      <Button size="sm" variant="outline" className="shrink-0 rounded-full bg-white" onClick={() => openFeature(record.run)}><Star className="mr-1.5 h-3.5 w-3.5" />Feature</Button>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : <p className="text-stone-500">Records appear once you have runs.</p>}
          </section>

          {/* Profile editor */}
          <section id="profile-editor" className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
            <SectionTitle eyebrow="Public page" title={own.profile ? "Profile editor" : "Create your profile"} icon={UserRound} />
            {own.profileLoading ? (
              <p className="flex items-center gap-2 text-stone-500"><LoaderCircle className="h-4 w-4 animate-spin" />Loading profile…</p>
            ) : (
              <ProfileEditor profile={own.profile} suggestedUsername={user?.email?.split("@")[0] ?? ""} saving={own.save.isPending} onSave={(input) => own.save.mutate(input)} />
            )}
          </section>

          {/* Integrations */}
          <section id="integrations" className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
            <SectionTitle eyebrow="Integrations" title="Connect sources" icon={CalendarCheck2} />
            <ProviderGrid />
          </section>

          {/* Settings */}
          <section id="settings" className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
            <SectionTitle eyebrow="Trust controls" title="Privacy & data" icon={Settings} />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-2xl border border-stone-200 p-3">
                {own.profile?.is_public ? <Globe2 className="mt-0.5 h-4 w-4 text-emerald-700" /> : <EyeOff className="mt-0.5 h-4 w-4 text-stone-500" />}
                <div>
                  <p className="font-medium">Profile is {own.profile ? (own.profile.is_public ? "public" : "private") : "not created"}</p>
                  <button type="button" className="text-sm text-emerald-800 underline underline-offset-2" onClick={() => scrollToSection("profile-editor")}>Change in profile editor</button>
                </div>
              </div>
              {[
                "Strava runs are visible only to you unless you feature one",
                "Route maps and start times are never published",
                "Heart-rate data is never published",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-stone-200 p-3"><Lock className="mt-0.5 h-4 w-4 text-emerald-700" /><p>{item}</p></div>
              ))}
            </div>
            {strava.connected ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-stone-50 p-4">
                <p className="text-sm text-stone-600">Disconnecting deletes all Strava runs Movata cached for you. Featured runs you published stay until you remove them.</p>
                <Button variant="outline" className="rounded-full bg-white text-red-700" disabled={strava.disconnect.isPending}
                  onClick={() => { if (window.confirm("Disconnect Strava? Movata will delete all of your cached Strava data.")) strava.disconnect.mutate(); }}>
                  <Unplug className="mr-2 h-4 w-4" />Disconnect Strava
                </Button>
              </div>
            ) : null}
          </section>
        </div>
      </div>

      <FeatureRunDialog
        open={Boolean(dialog)}
        onOpenChange={(open) => { if (!open) setDialog(null); }}
        draft={dialog?.draft ?? null}
        mode={dialog?.mode ?? "add"}
        unit={unit}
        username={own.profile?.username ?? ""}
        submitting={own.feature.isPending || own.editFeatured.isPending}
        onSubmit={submitDialog}
      />
    </main>
  );
};

export default Dashboard;
