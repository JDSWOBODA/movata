interface StatCardProps {
  label: string;
  value: string | number;
  detail?: string;
  tone?: "light" | "emerald" | "dark";
}

const tones = {
  light: "border-stone-200 bg-white/80 text-stone-950",
  emerald: "border-emerald-900/10 bg-emerald-700 text-white",
  dark: "border-stone-800 bg-stone-950 text-white",
};

export const StatCard = ({ label, value, detail, tone = "light" }: StatCardProps) => (
  <div className={`rounded-[1.35rem] border p-4 shadow-sm ${tones[tone]}`}>
    <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${tone === "light" ? "text-stone-500" : "text-white/70"}`}>{label}</p>
    <p className="mt-2 font-mono text-3xl font-semibold tabular-nums tracking-tight sm:text-4xl">{value}</p>
    {detail ? <p className={`mt-2 text-sm ${tone === "light" ? "text-stone-500" : "text-white/72"}`}>{detail}</p> : null}
  </div>
);
