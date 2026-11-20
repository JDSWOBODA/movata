import { Link } from "react-router-dom";
import { ChevronRight, MapPin, Medal, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { publicImageUrl } from "@/lib/images";
import { formatRaceDate, type RaceGoalRow, type RaceRow } from "@/lib/races";
import {
  COURSE_LABELS,
  formatRaceTime,
  goalGapLabel,
  personalBests,
  prAtTheTime,
  raceDate,
  raceDistanceText,
  resultHeadline,
  resultsByYear,
} from "@/lib/race-results";

/** Only what a visitor may see: public races, and goals the runner chose to share. */
export const visibleToPublic = (races: RaceRow[], goals: Map<string, RaceGoalRow>) => ({
  races: races.filter((race) => race.is_public),
  goals: new Map([...goals].filter(([, goal]) => goal.is_public)),
});

interface RaceResultsProps {
  races: RaceRow[];
  goals: Map<string, RaceGoalRow>;
  username: string;
  firstName: string;
}

/** Public running résumé: PR board, then every finished race grouped by year. */
export const RaceResults = ({ races, goals, username, firstName }: RaceResultsProps) => {
  const years = resultsByYear(races);
  if (!years.length) return null;
  const bests = personalBests(races);
  const prIds = prAtTheTime(races);
  const finishedCount = races.filter((race) => race.status === "done" && !race.dnf).length;

  return (
    <section id="results" className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Race history</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Results and personal bests</h2>
        </div>
        <p className="text-sm text-stone-500">{finishedCount} {finishedCount === 1 ? "race" : "races"} finished · results entered by {firstName}</p>
      </div>

      {bests.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {bests.map((pb) => (
            <Link key={pb.key} to={`/${username}/races/${pb.race.id}`}
              className="group rounded-[1.5rem] border border-stone-200 bg-white p-4 shadow-sm transition hover:border-emerald-300">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700"><Trophy className="h-3.5 w-3.5" />{pb.label} PR</p>
              <p className="mt-2 font-mono text-3xl font-semibold tracking-tight text-stone-950">{formatRaceTime(pb.race.finish_seconds)}</p>
              <p className="mt-1 truncate text-sm text-stone-500 group-hover:text-stone-700">{pb.race.name} · {raceDate(pb.race).slice(0, 4)}</p>
            </Link>
          ))}
        </div>
      ) : null}

      <div className="space-y-6">
        {years.map(({ year, races: list }) => (
          <div key={year}>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">{year}</h3>
            <ul className="divide-y divide-stone-200 overflow-hidden rounded-[1.5rem] border border-stone-200 bg-white shadow-sm">
              {list.map((race) => {
                const goal = goals.get(race.id);
                const photo = publicImageUrl(race.photo_path);
                return (
                  <li key={race.id}>
                    <Link to={`/${username}/races/${race.id}`} className="flex items-center gap-4 p-4 transition hover:bg-stone-50">
                      {photo ? <img src={photo} alt="" loading="lazy" className="hidden h-14 w-14 shrink-0 rounded-xl object-cover sm:block" /> : null}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-semibold text-stone-950">{race.name}</p>
                          {prIds.has(race.id) ? <Badge className="rounded-full bg-emerald-700 text-white hover:bg-emerald-700"><Medal className="mr-1 h-3 w-3" />PR</Badge> : null}
                          {race.course_type !== "road" ? <Badge variant="outline" className="rounded-full">{COURSE_LABELS[race.course_type]}</Badge> : null}
                        </div>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-stone-500">
                          <span>{formatRaceDate(raceDate(race))}</span>
                          {raceDistanceText(race) ? <span>· {raceDistanceText(race)}</span> : null}
                          {race.location ? <span className="inline-flex items-center gap-1">· <MapPin className="h-3.5 w-3.5" />{race.location}</span> : null}
                        </p>
                        {race.tags.length ? (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {race.tags.slice(0, 3).map((tag) => <span key={tag} className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">{tag}</span>)}
                          </div>
                        ) : null}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className={`font-mono text-xl font-semibold ${race.dnf ? "text-stone-400" : "text-stone-950"}`}>{resultHeadline(race)}</p>
                        {goal && race.finish_seconds && !race.dnf ? <p className={`text-xs font-medium ${race.finish_seconds <= goal.goal_seconds ? "text-emerald-700" : "text-stone-500"}`}>{goalGapLabel(race.finish_seconds, goal.goal_seconds)}</p> : null}
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-stone-300" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
};
