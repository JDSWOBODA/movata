import { Trophy } from "lucide-react";
import { formatDate } from "@/lib/format";
import { publicImageUrl } from "@/lib/images";
import { cheerCount } from "@/lib/engagement";
import type { MilestoneRow } from "@/lib/milestones";
import { CheerButton } from "./CheerButton";

interface MilestoneTimelineProps {
  milestones: MilestoneRow[];
  firstName: string;
  profileId: string;
  cheers?: Map<string, number>;
  readOnly?: boolean;
}

/** Public "Milestones" timeline: newest first, each one cheerable. */
export const MilestoneTimeline = ({ milestones, firstName, profileId, cheers, readOnly }: MilestoneTimelineProps) => {
  if (!milestones.length) return null;
  return (
    <section>
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Milestones</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">Moments {firstName} has earned</h2>
      </div>
      <ol className="space-y-4">
        {milestones.map((milestone) => {
          const photo = publicImageUrl(milestone.photo_path);
          return (
            <li key={milestone.id} id={`milestone-${milestone.id}`} className="grid grid-cols-[auto_1fr] gap-4">
              <div className="flex flex-col items-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-700 text-white"><Trophy className="h-5 w-5" /></span>
                <span className="mt-2 w-px flex-1 bg-stone-200" aria-hidden="true" />
              </div>
              <article className="overflow-hidden rounded-[1.4rem] border border-stone-200 bg-white p-4 shadow-sm">
                {photo ? <img src={photo} alt="" loading="lazy" className="-mx-4 -mt-4 mb-3 aspect-[16/9] w-[calc(100%+2rem)] max-w-none object-cover" /> : null}
                <p className="font-mono text-sm font-semibold text-emerald-800">{formatDate(milestone.achieved_on)}</p>
                <h3 className="mt-1 text-lg font-semibold leading-tight">{milestone.title}</h3>
                {milestone.detail ? <p className="mt-2 text-sm leading-6 text-stone-600">{milestone.detail}</p> : null}
                {cheers ? (
                  <div className="mt-3">
                    <CheerButton profileId={profileId} type="milestone" targetId={milestone.id} count={cheerCount(cheers, "milestone", milestone.id)} readOnly={readOnly} />
                  </div>
                ) : null}
              </article>
            </li>
          );
        })}
      </ol>
    </section>
  );
};
