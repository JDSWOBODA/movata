import type { NormalizedActivity } from "./movata-types";
import { metersToMiles } from "./format";

const localDateKey = (date = new Date()) => {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

/** Week (Mon–Sun), month and year totals for the dashboard stat cards. */
export const summarizeActivities = (activities: NormalizedActivity[], now = new Date()) => {
  const today = localDateKey(now);
  const dayOfWeek = (now.getDay() + 6) % 7; // Monday = 0
  const weekStart = localDateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek));
  const monthPrefix = today.slice(0, 7);
  const yearPrefix = today.slice(0, 4);

  let weekMeters = 0;
  let monthMeters = 0;
  let monthRuns = 0;
  let yearMeters = 0;

  activities.forEach((activity) => {
    if (activity.localDate >= weekStart && activity.localDate <= today) weekMeters += activity.distanceMeters;
    if (activity.localDate.startsWith(monthPrefix)) {
      monthMeters += activity.distanceMeters;
      monthRuns += 1;
    }
    if (activity.localDate.startsWith(yearPrefix)) yearMeters += activity.distanceMeters;
  });

  const round = (meters: number) => Math.round(metersToMiles(meters) * 10) / 10;
  return {
    milesThisWeek: round(weekMeters),
    milesThisMonth: round(monthMeters),
    runsThisMonth: monthRuns,
    annualMiles: Math.round(metersToMiles(yearMeters)),
  };
};
