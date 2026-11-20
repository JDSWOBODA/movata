import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, MousePointerClick, TrendingDown, TrendingUp } from "lucide-react";
import { fetchEngagementSummary, markCheersSeen } from "@/lib/engagement";

const Trend = ({ now, before }: { now: number; before: number }) => {
  if (now === before) return <span className="text-xs text-stone-400">same as last week</span>;
  const up = now > before;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${up ? "text-emerald-700" : "text-stone-500"}`}>
      <Icon className="h-3.5 w-3.5" />{up ? "+" : ""}{now - before} vs last week
    </span>
  );
};

/** "Your page this week": the reason to open the dashboard on Monday morning. */
export const EngagementCard = ({ userId, isPublic, publicPath }: { userId: string; isPublic: boolean; publicPath: string | null }) => {
  const summary = useQuery({ queryKey: ["engagement-summary", userId], queryFn: fetchEngagementSummary, staleTime: 60_000 });
  const markedSeen = useRef(false);

  // Keep showing "new" this visit; clear it for next time.
  useEffect(() => {
    if (markedSeen.current || !summary.data?.newCheers) return;
    markedSeen.current = true;
    void markCheersSeen(userId).catch(() => undefined);
  }, [summary.data?.newCheers, userId]);

  const data = summary.data;
  const stats = [
    { label: "Page views", icon: <Eye className="h-4 w-4" />, now: data?.views7 ?? 0, before: data?.viewsPrev7 ?? 0 },
    { label: "Cheers", icon: <span aria-hidden="true">👏</span>, now: data?.cheers7 ?? 0, before: data?.cheersPrev7 ?? 0 },
    { label: "Gear clicks", icon: <MousePointerClick className="h-4 w-4" />, now: data?.clicks7 ?? 0, before: data?.clicksPrev7 ?? 0 },
  ];

  return (
    <div className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Your page this week</p>
        {data?.newCheers ? (
          <span className="rounded-full bg-emerald-700 px-3 py-1 text-sm font-semibold text-white">🎉 {data.newCheers} new {data.newCheers === 1 ? "cheer" : "cheers"}</span>
        ) : null}
      </div>
      {!isPublic ? (
        <p className="mt-3 text-sm text-stone-500">Your profile is private, so visitors can't see it yet. Make it public in the Profile Editor to start getting views and cheers.</p>
      ) : (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-stone-50 p-4">
                <p className="flex items-center gap-2 text-sm text-stone-500">{stat.icon}{stat.label}</p>
                <p className="mt-1 font-mono text-3xl font-semibold tabular-nums">{summary.isLoading ? "–" : stat.now}</p>
                {summary.isLoading ? null : <Trend now={stat.now} before={stat.before} />}
              </div>
            ))}
          </div>
          {!summary.isLoading && data && data.views7 === 0 && publicPath ? (
            <p className="mt-3 text-sm text-stone-500">No visitors yet this week. Share <span className="font-medium text-stone-700">movata.vercel.app{publicPath}</span> in your Instagram or Strava bio.</p>
          ) : null}
          <p className="mt-3 text-xs text-stone-400">Last 7 days. Each visitor counts once a day; your own visits don't count.</p>
        </>
      )}
    </div>
  );
};
