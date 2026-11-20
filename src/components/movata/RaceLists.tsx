import { Bookmark, CalendarDays, Check, ExternalLink, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cheerCount, countdownLabel, daysUntil } from "@/lib/engagement";
import { CheerButton } from "./CheerButton";
import { publicImageUrl } from "@/lib/images";
import { formatRaceDate, groupRaces, type RaceRow } from "@/lib/races";

const RaceLink = ({ url }: { url: string | null }) =>
  url ? (
    <a href={url} target="_blank" rel="noopener noreferrer nofollow ugc" className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-emerald-800 underline underline-offset-2">
      Race website<ExternalLink className="h-3.5 w-3.5" />
    </a>
  ) : null;

const RacePhoto = ({ path }: { path: string | null }) => {
  const url = publicImageUrl(path);
  return url ? <img src={url} alt="" loading="lazy" className="-mx-4 -mt-4 mb-3 aspect-[16/9] w-[calc(100%+2rem)] max-w-none object-cover" /> : null;
};

/** Public "What's next" block: registered races and the bucket list (with races already checked off). */
interface RaceListsProps {
  races: RaceRow[];
  firstName: string;
  profileId: string;
  /** Public cheer totals; omitted for private profiles (no cheering). */
  cheers?: Map<string, number>;
  readOnly?: boolean;
}

export const RaceLists = ({ races, firstName, profileId, cheers, readOnly }: RaceListsProps) => {
  const { upcoming, bucketList, done } = groupRaces(races);
  if (!upcoming.length && !bucketList.length && !done.length) return null;
  const dreamTotal = bucketList.length + done.length;

  return (
    <section>
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">What’s next</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">Upcoming starts and dream races</h2>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-700 text-white"><CalendarDays className="h-5 w-5" /></span>
            <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800">Upcoming</p><h3 className="text-2xl font-semibold tracking-tight">On the calendar</h3></div>
          </div>
          <div className="mt-5 space-y-3">
            {upcoming.length ? upcoming.map((race) => (
              <article key={race.id} className="overflow-hidden rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
                <RacePhoto path={race.photo_path} />
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-semibold">{race.name}</h4>
                    <p className="mt-1 text-sm font-medium text-emerald-800">{formatRaceDate(race.race_date)}</p>
                    {race.race_date ? (
                      <p className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${daysUntil(race.race_date) <= 7 ? "bg-amber-100 text-amber-900" : "bg-emerald-50 text-emerald-800"}`}>
                        {countdownLabel(daysUntil(race.race_date))}
                      </p>
                    ) : null}
                  </div>
                  {race.distance_label ? <Badge className="shrink-0 rounded-full bg-emerald-700 text-white hover:bg-emerald-700">{race.distance_label}</Badge> : null}
                </div>
                {race.location ? <p className="mt-3 flex items-center gap-2 text-sm text-stone-500"><MapPin className="h-4 w-4 text-emerald-700" />{race.location}</p> : null}
                {race.note ? <p className="mt-2 text-xs font-medium uppercase tracking-[0.12em] text-stone-500">{race.note}</p> : null}
                <RaceLink url={race.url} />
                {cheers ? (
                  <div className="mt-3">
                    <CheerButton profileId={profileId} type="race" targetId={race.id} count={cheerCount(cheers, "race", race.id)} readOnly={readOnly} label="Good luck" />
                  </div>
                ) : null}
              </article>
            )) : <p className="rounded-2xl bg-white/70 p-4 text-sm text-stone-500">No races on the calendar right now.</p>}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-600 text-white"><Bookmark className="h-5 w-5" /></span>
            <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-800">Bucket list</p><h3 className="text-2xl font-semibold tracking-tight">Dreaming big</h3></div>
          </div>
          {dreamTotal ? (
            <div className="mt-4">
              <p className="text-sm font-medium text-amber-900">{done.length} of {dreamTotal} checked off</p>
              <Progress value={(done.length / dreamTotal) * 100} className="mt-2 h-2 bg-amber-100 [&>div]:bg-amber-600" />
            </div>
          ) : null}
          <div className="mt-5 space-y-3">
            {bucketList.map((race) => (
              <article key={race.id} className="overflow-hidden rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
                <RacePhoto path={race.photo_path} />
                <div className="flex items-start justify-between gap-3">
                  <h4 className="font-semibold">{race.name}</h4>
                  {race.distance_label ? <Badge variant="outline" className="shrink-0 rounded-full border-amber-300 bg-amber-50 text-amber-900">{race.distance_label}</Badge> : null}
                </div>
                {race.location ? <p className="mt-3 flex items-center gap-2 text-sm text-stone-500"><MapPin className="h-4 w-4 text-amber-700" />{race.location}</p> : null}
                {race.note ? <p className="mt-2 text-xs font-medium uppercase tracking-[0.12em] text-amber-800">{race.note}</p> : null}
                <RaceLink url={race.url} />
              </article>
            ))}
            {!bucketList.length && !done.length ? <p className="rounded-2xl bg-white/70 p-4 text-sm text-stone-500">{firstName} hasn't added any dream races yet.</p> : null}
            {done.length ? (
              <div className="rounded-2xl bg-white/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">Checked off</p>
                <ul className="mt-2 space-y-1.5">
                  {done.map((race) => (
                    <li key={race.id} className="flex items-center gap-2 text-sm text-stone-700">
                      <Check className="h-4 w-4 shrink-0 text-emerald-700" />
                      {race.featured_run_id ? (
                        <a href={`#run-${race.featured_run_id}`} className="font-medium underline underline-offset-2">{race.name}</a>
                      ) : <span className="font-medium">{race.name}</span>}
                      {race.completed_on || race.race_date ? <span className="text-stone-500">· {formatRaceDate(race.completed_on ?? race.race_date)}</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
};
