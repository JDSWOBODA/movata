import { Share2, Heart, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RunnerProfile, StreakSummary } from "@/lib/runstory-types";
import { demoTotals } from "@/lib/sample-data";
import { formatDistance } from "@/lib/format";
import { StatCard } from "./StatCard";

interface ProfileHeroProps {
  profile: RunnerProfile;
  streak: StreakSummary;
}

export const ProfileHero = ({ profile, streak }: ProfileHeroProps) => (
  <section className="relative overflow-hidden rounded-b-[2rem] border-b border-stone-200 bg-[#fbfaf6] sm:rounded-b-[3rem]">
    <div className="absolute inset-0 bg-[url('/assets/runstory-route-texture.png')] bg-cover bg-center opacity-[0.12]" />
    <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1.05fr_.95fr] lg:items-end">
        <div>
          <div className="overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-sm">
            <div className="h-48 bg-cover bg-center sm:h-64" style={{ backgroundImage: `url(${profile.coverUrl})` }} />
            <div className="p-5 sm:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="flex items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-emerald-700 text-2xl font-semibold text-white shadow-sm">MC</div>
                    <div>
                      <h1 className="text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">{profile.displayName}</h1>
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-stone-500">
                        @{profile.username}<span aria-hidden="true">·</span><MapPin className="h-4 w-4" />{profile.location}
                      </p>
                    </div>
                  </div>
                  <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-650">{profile.bio}</p>
                </div>
                <div className="flex gap-2">
                  <Button className="rounded-full bg-emerald-700 text-white hover:bg-emerald-800"><Heart className="mr-2 h-4 w-4" />Support</Button>
                  <Button variant="outline" className="rounded-full border-stone-300 bg-white"><Share2 className="mr-2 h-4 w-4" />Share</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-[2rem] border border-emerald-900/10 bg-emerald-700 p-6 text-white shadow-sm sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-50/75">Current streak</p>
            <div className="mt-2 flex items-end gap-3">
              <span className="font-mono text-8xl font-semibold leading-none tabular-nums tracking-[-0.08em] sm:text-9xl">{streak.currentStreakDays}</span>
              <span className="pb-3 text-2xl font-semibold">days</span>
            </div>
            <p className="mt-4 max-w-md text-lg leading-7 text-emerald-50">{profile.displayName.split(" ")[0]} has run for {streak.currentStreakDays} consecutive days.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Longest streak" value={streak.longestStreakDays} detail="days" />
            <StatCard label="Lifetime distance" value={formatDistance(demoTotals.totalDistanceMeters, profile.preferredUnit, 0)} detail={`${demoTotals.totalRuns.toLocaleString()} runs`} />
            <StatCard label="Running since" value="2018" detail="first imported run" />
            <StatCard label="Weekly average" value={`${demoTotals.averageWeeklyMiles}`} detail="miles / week" />
          </div>
        </div>
      </div>
    </div>
  </section>
);
