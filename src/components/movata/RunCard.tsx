import { CalendarDays, MapPin, Mountain, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { NormalizedActivity } from "@/lib/movata-types";
import { formatDate, formatDistance, formatDuration, formatPace } from "@/lib/format";
import { stravaActivityUrl } from "@/lib/strava";

interface RunCardProps {
  activity: NormalizedActivity;
  unit?: "mi" | "km";
  compact?: boolean;
}

export const RunCard = ({ activity, unit = "mi", compact = false }: RunCardProps) => (
  <article className="group min-w-[280px] rounded-[1.4rem] border border-stone-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:min-w-0">
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="flex flex-wrap gap-1.5">
          {activity.highlightTypes?.slice(0, 2).map((highlight) => (
            <Badge key={highlight} variant="secondary" className="rounded-full bg-emerald-50 px-2.5 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-50">
              {highlight.replace("_", " ")}
            </Badge>
          ))}
          {activity.personalRecordTypes?.slice(0, 1).map((record) => (
            <Badge key={record} className="rounded-full bg-stone-950 px-2.5 text-[11px] text-white hover:bg-stone-950">
              <Trophy className="mr-1 h-3 w-3" /> {record}
            </Badge>
          ))}
        </div>
        <h3 className="mt-3 text-lg font-semibold leading-tight tracking-tight text-stone-950">{activity.title}</h3>
      </div>
      <span className="rounded-full border border-stone-200 px-2.5 py-1 text-xs font-medium text-stone-500">{activity.provider.replace("_", " ")}</span>
    </div>

    <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-stone-50 p-3">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">Distance</p>
        <p className="font-mono text-lg font-semibold tabular-nums text-stone-950">{formatDistance(activity.distanceMeters, unit)}</p>
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">Pace</p>
        <p className="font-mono text-lg font-semibold tabular-nums text-stone-950">{formatPace(activity.averagePaceSecondsPerKm, unit)}</p>
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">Time</p>
        <p className="font-mono text-lg font-semibold tabular-nums text-stone-950">{formatDuration(activity.movingTimeSeconds)}</p>
      </div>
    </div>

    {!compact ? (
      <div className="mt-4 h-28 overflow-hidden rounded-2xl border border-stone-200 bg-[#f3f0e8] p-3">
        <svg viewBox="0 0 260 110" className="h-full w-full" aria-hidden="true">
          <path d="M9 79 C46 18, 79 92, 113 43 S180 17, 192 61 S232 94, 251 33" fill="none" stroke="#047857" strokeWidth="6" strokeLinecap="round" opacity=".9" />
          <path d="M9 79 C46 18, 79 92, 113 43 S180 17, 192 61 S232 94, 251 33" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" opacity=".55" />
          <circle cx="9" cy="79" r="6" fill="#0f766e" />
          <circle cx="251" cy="33" r="6" fill="#1f2937" />
        </svg>
      </div>
    ) : null}

    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-stone-500">
      <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{formatDate(activity.localDate)}</span>
      {activity.location ? <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{activity.location}</span> : null}
      {activity.elevationGainMeters ? <span className="inline-flex items-center gap-1.5"><Mountain className="h-4 w-4" />{Math.round(activity.elevationGainMeters)}m gain</span> : null}
    </div>
    {activity.note ? <p className="mt-3 border-t border-stone-200 pt-3 text-sm leading-6 text-stone-600">{activity.note}</p> : null}
    {stravaActivityUrl(activity) ? (
      <a href={stravaActivityUrl(activity)} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-bold text-[#FC5200] underline underline-offset-2">
        View on Strava
      </a>
    ) : null}
  </article>
);
