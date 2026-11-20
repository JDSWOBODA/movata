import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, Copy, ExternalLink, Flag, LoaderCircle, MapPin, Medal, Target, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/movata/Logo";
import { CheerButton } from "@/components/movata/CheerButton";
import { useSession } from "@/contexts/SessionContext";
import { product } from "@/lib/brand";
import { cheerCount, fetchCheerCounts } from "@/lib/engagement";
import { publicImageUrl } from "@/lib/images";
import { fetchProfileByUsername } from "@/lib/profile";
import { fetchRaceGoals, fetchRaces, formatRaceDate } from "@/lib/races";
import {
  COURSE_LABELS,
  formatRaceTime,
  goalGapLabel,
  isPrEligible,
  personalBests,
  prAtTheTime,
  raceDate,
  raceDistanceText,
  resultHeadline,
} from "@/lib/race-results";
import { visibleToPublic } from "@/components/movata/RaceResults";

const setMeta = (property: string, content: string) => {
  let element = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("property", property);
    document.head.appendChild(element);
  }
  element.content = content;
};

const NotFound = ({ username }: { username?: string }) => (
  <main className="min-h-screen bg-[#fbfaf6] px-4 py-8">
    <div className="mx-auto max-w-2xl rounded-[2rem] border border-stone-200 bg-white p-8 text-center shadow-sm">
      <Logo className="justify-center" />
      <h1 className="mt-8 text-3xl font-semibold tracking-tight text-stone-950">Race not found</h1>
      <p className="mt-3 text-stone-500">This race may be private or no longer listed.</p>
      {username ? <Button asChild variant="outline" className="mt-6 rounded-full"><Link to={`/${username}`}>Back to @{username}</Link></Button> : null}
    </div>
  </main>
);

/** One race on a runner's public page: result, goal (if shared), report and tags. No Strava data. */
const RaceResult = () => {
  const { username = "", raceId = "" } = useParams();
  const { user } = useSession();
  const profile = useQuery({ queryKey: ["profile-by-username", username], queryFn: () => fetchProfileByUsername(username), enabled: Boolean(username) });
  const profileId = profile.data?.id;
  const races = useQuery({ queryKey: ["public-races", profileId], queryFn: () => fetchRaces(profileId!), enabled: Boolean(profileId) });
  const goals = useQuery({ queryKey: ["public-race-goals", profileId], queryFn: () => fetchRaceGoals(profileId!), enabled: Boolean(profileId) });
  const cheers = useQuery({ queryKey: ["public-cheers", profileId], queryFn: () => fetchCheerCounts(profileId!), enabled: Boolean(profileId && profile.data?.is_public) });

  // Owners see exactly what visitors see on this page.
  const visible = visibleToPublic(races.data ?? [], goals.data ?? new Map());
  const race = visible.races.find((item) => item.id === raceId);
  const goal = race ? visible.goals.get(race.id) : undefined;
  const name = profile.data ? profile.data.display_name || `@${profile.data.username}` : "";
  const firstName = name.split(" ")[0];

  useEffect(() => {
    if (!race || !profile.data) return;
    const title = `${race.name}: ${resultHeadline(race)} · ${name} · ${product.name}`;
    document.title = title;
    setMeta("og:title", title);
    setMeta("og:description", race.report ? race.report.slice(0, 180) : `${name}'s result at ${race.name}.`);
    setMeta("og:type", "article");
    setMeta("og:url", window.location.href);
    const image = publicImageUrl(race.photo_path) ?? publicImageUrl(profile.data.cover_path);
    if (image) setMeta("og:image", image);
  }, [race, profile.data, name]);

  if (profile.isLoading || races.isLoading) {
    return <main className="flex min-h-screen items-center justify-center bg-[#fbfaf6]"><LoaderCircle className="h-6 w-6 animate-spin text-emerald-700" /></main>;
  }
  if (!profile.data || !race || race.status !== "done") return <NotFound username={profile.data?.username} />;

  const prIds = prAtTheTime(visible.races);
  const isCurrentPr = personalBests(visible.races).some((pb) => pb.race.id === race.id);
  const photo = publicImageUrl(race.photo_path);
  const distance = raceDistanceText(race);

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Race link copied");
  };

  return (
    <main className="min-h-screen bg-[#fbfaf6] text-stone-950">
      <div className="border-b border-stone-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <Logo />
          <Button variant="ghost" className="rounded-full" onClick={() => void copyLink()}><Copy className="mr-2 h-4 w-4" />Copy link</Button>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-10">
        <Link to={`/${profile.data.username}#results`} className="inline-flex items-center gap-2 text-sm font-medium text-emerald-800 hover:underline">
          <ArrowLeft className="h-4 w-4" />{name}'s races
        </Link>

        <article className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm">
          {photo ? <img src={photo} alt="" className="aspect-[16/9] w-full object-cover" /> : null}
          <div className="space-y-6 p-6 sm:p-8">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {isCurrentPr ? <Badge className="rounded-full bg-emerald-700 text-white hover:bg-emerald-700"><Trophy className="mr-1 h-3.5 w-3.5" />Current PR</Badge>
                  : prIds.has(race.id) ? <Badge className="rounded-full bg-emerald-100 text-emerald-900 hover:bg-emerald-100"><Medal className="mr-1 h-3.5 w-3.5" />PR at the time</Badge> : null}
                <Badge variant="outline" className="rounded-full">{COURSE_LABELS[race.course_type]}</Badge>
                {distance ? <Badge variant="outline" className="rounded-full">{distance}</Badge> : null}
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{race.name}</h1>
              <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-stone-500">
                <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-emerald-700" />{formatRaceDate(raceDate(race))}</span>
                {race.location ? <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-emerald-700" />{race.location}</span> : null}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.5rem] bg-stone-950 p-5 text-white">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300"><Flag className="h-3.5 w-3.5" />{race.dnf ? "Result" : "Finish time"}</p>
                <p className="mt-2 font-mono text-5xl font-semibold tracking-tight">{resultHeadline(race)}</p>
                {!isPrEligible(race) && race.finish_seconds && !race.dnf && (race.course_type === "trail" || race.course_type === "xc") ? (
                  <p className="mt-2 text-xs text-stone-400">{COURSE_LABELS[race.course_type]} times aren't compared for PRs.</p>
                ) : null}
              </div>
              {goal ? (
                <div className="rounded-[1.5rem] border border-stone-200 p-5">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500"><Target className="h-3.5 w-3.5" />Goal</p>
                  <p className="mt-2 font-mono text-4xl font-semibold tracking-tight">{formatRaceTime(goal.goal_seconds)}</p>
                  {race.finish_seconds && !race.dnf ? (
                    <p className={`mt-1 text-sm font-medium ${race.finish_seconds <= goal.goal_seconds ? "text-emerald-700" : "text-stone-500"}`}>{goalGapLabel(race.finish_seconds, goal.goal_seconds)}</p>
                  ) : null}
                </div>
              ) : null}
            </div>

            {race.tags.length ? (
              <div className="flex flex-wrap gap-1.5">
                {race.tags.map((tag) => <span key={tag} className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-900">{tag}</span>)}
              </div>
            ) : null}

            {race.report ? (
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">How it went</h2>
                <p className="mt-2 whitespace-pre-line leading-7 text-stone-800">{race.report}</p>
              </div>
            ) : null}
            {race.note ? <p className="text-sm text-stone-500">{race.note}</p> : null}

            <div className="flex flex-wrap items-center gap-3 border-t border-stone-200 pt-5">
              {profile.data.is_public ? (
                <CheerButton profileId={profile.data.id} type="race" targetId={race.id} count={cheerCount(cheers.data, "race", race.id)} readOnly={user?.id === profile.data.id} label="Nice race" />
              ) : null}
              {race.url ? (
                <a href={race.url} target="_blank" rel="noopener noreferrer nofollow ugc" className="inline-flex items-center gap-1 text-sm font-medium text-emerald-800 underline underline-offset-2">
                  Race website<ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </div>
          </div>
        </article>

        <p className="text-center text-sm text-stone-500">
          Results are entered by {firstName}. <Link to={`/${profile.data.username}`} className="font-medium text-emerald-800 hover:underline">See all of {firstName}'s races</Link>
        </p>
      </div>
    </main>
  );
};

export default RaceResult;
