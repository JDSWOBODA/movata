import type { CardSpec } from "./share-card";
import type { FeaturedRunRow, ProfileRow } from "./profile";
import type { MilestoneRow } from "./milestones";
import type { RaceRow } from "./races";
import { formatDate, formatDistance, formatDuration } from "./format";
import { publicImageUrl } from "./images";
import { HIGHLIGHT_LABELS } from "./profile";

const who = (profile: ProfileRow) => ({ name: profile.display_name || `@${profile.username}`, username: profile.username });

const LONG_RUN_HEADLINE: Record<string, string> = { "100mi": "100 mi", "100k": "100K", "50mi": "50 mi", "50k": "50K", marathon: "26.2" };

export const featuredRunCard = (run: FeaturedRunRow, profile: ProfileRow): CardSpec => ({
  ...who(profile),
  eyebrow: run.highlight_type === "best_race" ? "Race finish" : HIGHLIGHT_LABELS[run.highlight_type],
  headline: formatDistance(run.distance_meters, profile.preferred_unit),
  title: run.title,
  subtitle: `${formatDate(run.run_date)} · ${formatDuration(run.moving_time_seconds)}`,
  photoUrl: publicImageUrl(run.photo_path),
  slug: `run-${run.id.slice(0, 8)}`,
});

export const milestoneCard = (milestone: MilestoneRow, profile: ProfileRow): CardSpec => {
  const [, a, b] = (milestone.key ?? "").split(":");
  let headline = milestone.title.length <= 12 ? milestone.title : "Milestone";
  if (milestone.kind === "yearly_distance" && b) headline = `${Number.parseInt(b, 10).toLocaleString()} ${b.endsWith("km") ? "km" : "mi"}`;
  if (milestone.kind === "streak" && b) headline = `${Number(b).toLocaleString()} days`;
  if (milestone.kind === "long_run" && a && LONG_RUN_HEADLINE[a]) headline = LONG_RUN_HEADLINE[a];
  return {
    ...who(profile),
    eyebrow: "Milestone",
    headline,
    title: milestone.title,
    subtitle: milestone.detail || formatDate(milestone.achieved_on),
    photoUrl: publicImageUrl(milestone.photo_path),
    slug: `milestone-${milestone.id.slice(0, 8)}`,
  };
};

export const raceDoneCard = (race: RaceRow, profile: ProfileRow): CardSpec => ({
  ...who(profile),
  eyebrow: "Checked off ✓",
  headline: race.distance_label || "Done",
  title: race.name,
  subtitle: [race.completed_on || race.race_date ? formatDate((race.completed_on ?? race.race_date)!) : null, race.location || null].filter(Boolean).join(" · "),
  photoUrl: publicImageUrl(race.photo_path),
  slug: `race-${race.id.slice(0, 8)}`,
});
