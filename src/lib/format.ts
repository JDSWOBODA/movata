export const metersToMiles = (meters: number) => meters / 1609.344;
export const metersToKm = (meters: number) => meters / 1000;

export const formatDistance = (meters: number, unit: "mi" | "km" = "mi", digits = 1) => {
  const value = unit === "mi" ? metersToMiles(meters) : metersToKm(meters);
  return `${value.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits })} ${unit}`;
};

export const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remaining = seconds % 60;
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
};

/** "7:52/mi", or just "7:52" with withUnit = false (when the distance already shows the unit). */
export const formatPace = (secondsPerKm?: number, unit: "mi" | "km" = "mi", withUnit = true) => {
  if (!secondsPerKm) return "—";
  const seconds = unit === "mi" ? secondsPerKm * 1.609344 : secondsPerKm;
  return withUnit ? `${formatDuration(Math.round(seconds))}/${unit}` : formatDuration(Math.round(seconds));
};

export const compactNumber = (value: number) =>
  Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(value);

export const formatDate = (dateKey: string) =>
  new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(`${dateKey}T12:00:00`),
  );
