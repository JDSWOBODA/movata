import type { NormalizedActivity } from "./runstory-types";

export interface DuplicateCandidate {
  activityId: string;
  possibleDuplicateId: string;
  confidence: "high" | "medium";
  reasons: string[];
}

const minutesApart = (a: string, b: string) =>
  Math.abs(new Date(a).getTime() - new Date(b).getTime()) / 60_000;

const percentDifference = (a: number, b: number) => {
  const average = (Math.abs(a) + Math.abs(b)) / 2;
  return average === 0 ? 0 : Math.abs(a - b) / average;
};

export const findLikelyDuplicates = (
  activities: NormalizedActivity[],
): DuplicateCandidate[] => {
  const candidates: DuplicateCandidate[] = [];

  for (let i = 0; i < activities.length; i += 1) {
    for (let j = i + 1; j < activities.length; j += 1) {
      const left = activities[i];
      const right = activities[j];
      const reasons: string[] = [];

      if (left.provider === right.provider && left.externalId && left.externalId === right.externalId) {
        reasons.push("Same provider activity ID");
      }

      const timeWindow = minutesApart(left.startedAt, right.startedAt);
      const distanceDelta = percentDifference(left.distanceMeters, right.distanceMeters);
      const durationDelta = percentDifference(left.movingTimeSeconds, right.movingTimeSeconds);

      if (timeWindow <= 20) reasons.push("Start times are within 20 minutes");
      if (distanceDelta <= 0.03) reasons.push("Distance differs by less than 3%");
      if (durationDelta <= 0.05) reasons.push("Moving time differs by less than 5%");

      if (reasons.length >= 3 || reasons.includes("Same provider activity ID")) {
        candidates.push({
          activityId: left.id,
          possibleDuplicateId: right.id,
          confidence: reasons.length >= 3 ? "high" : "medium",
          reasons,
        });
      }
    }
  }

  return candidates;
};
