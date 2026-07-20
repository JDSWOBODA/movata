import { useMemo } from "react";
import { buildActivityByDate } from "@/lib/streaks";
import type { NormalizedActivity } from "@/lib/runstory-types";
import { formatDistance } from "@/lib/format";

interface HeatMapProps {
  activities: NormalizedActivity[];
  longestStart?: string;
  longestEnd?: string;
  currentStart?: string;
  unit?: "mi" | "km";
}

const MS_PER_DAY = 86_400_000;
const weekdayLabels = ["M", "", "W", "", "F", "", ""];

const intensityClass = (meters: number) => {
  if (meters === 0) return "bg-stone-100";
  if (meters < 3000) return "bg-emerald-100";
  if (meters < 7000) return "bg-emerald-300";
  if (meters < 12000) return "bg-emerald-500";
  return "bg-emerald-800";
};

export const HeatMap = ({ activities, longestStart, longestEnd, currentStart, unit = "mi" }: HeatMapProps) => {
  const byDate = useMemo(() => buildActivityByDate(activities), [activities]);
  const days = useMemo(() => {
    const end = new Date();
    end.setHours(12, 0, 0, 0);
    const start = new Date(end.getTime() - 364 * MS_PER_DAY);
    return Array.from({ length: 365 }, (_, index) => {
      const date = new Date(start.getTime() + index * MS_PER_DAY);
      const key = date.toISOString().slice(0, 10);
      return { key, date, data: byDate.get(key) };
    });
  }, [byDate]);

  const weeks = useMemo(() => {
    const rows: typeof days[] = [];
    for (let index = 0; index < days.length; index += 7) rows.push(days.slice(index, index + 7));
    return rows;
  }, [days]);

  return (
    <section className="rounded-[1.75rem] border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 border-b border-stone-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Consistency map</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">365 days of showing up</h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-stone-500">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <span key={level} className={`h-3 w-3 rounded-[4px] ${intensityClass(level * 3500)}`} />
          ))}
          <span>More</span>
        </div>
      </div>
      <div className="mt-5 overflow-x-auto pb-2" role="img" aria-label="Running heat map for the last year">
        <div className="min-w-[760px]">
          <div className="mb-2 ml-7 grid grid-cols-12 text-xs text-stone-500">
            {Array.from({ length: 12 }, (_, index) => (
              <span key={index}>{new Intl.DateTimeFormat(undefined, { month: "short" }).format(new Date(new Date().getFullYear(), index, 1))}</span>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="grid grid-rows-7 gap-1 pt-0 text-[10px] text-stone-400">
              {weekdayLabels.map((label, index) => <span key={`${label}-${index}`} className="h-3.5 leading-3.5">{label}</span>)}
            </div>
            <div className="flex gap-1">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-rows-7 gap-1">
                  {week.map(({ key, data }) => {
                    const inLongest = longestStart && longestEnd && key >= longestStart && key <= longestEnd;
                    const inCurrent = currentStart && key >= currentStart;
                    return (
                      <button
                        key={key}
                        type="button"
                        title={`${key}: ${data?.runs ?? 0} run${data?.runs === 1 ? "" : "s"}${data ? `, ${formatDistance(data.distanceMeters, unit)}` : ""}`}
                        className={`h-3.5 w-3.5 rounded-[4px] transition hover:scale-125 focus:outline-none focus:ring-2 focus:ring-emerald-700 ${intensityClass(data?.distanceMeters ?? 0)} ${inCurrent ? "ring-1 ring-emerald-900/60" : ""} ${inLongest ? "outline outline-1 outline-stone-900/20" : ""}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-stone-500">
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-800">Current streak outlined</span>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-stone-700">Longest streak subtly framed</span>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-stone-700">Tap or hover for distance</span>
      </div>
    </section>
  );
};
