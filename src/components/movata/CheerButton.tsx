import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { cheeredToday, sendCheer, type CheerTarget } from "@/lib/engagement";

interface CheerButtonProps {
  profileId: string;
  type: CheerTarget;
  targetId?: string | null;
  count: number;
  /** The owner sees the count but can't cheer themselves. */
  readOnly?: boolean;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

/** One tap of encouragement. Counted once per visitor per day; the total is public. */
export const CheerButton = ({ profileId, type, targetId, count, readOnly, label = "Cheer", size = "sm", className }: CheerButtonProps) => {
  const [total, setTotal] = useState(count);
  const [done, setDone] = useState(false);
  const [pulse, setPulse] = useState(false);

  useEffect(() => setTotal((current) => Math.max(current, count)), [count]);
  useEffect(() => setDone(cheeredToday(profileId, type, targetId)), [profileId, type, targetId]);

  const cheer = async () => {
    if (readOnly || done) return;
    setDone(true);
    setPulse(true);
    setTotal((current) => current + 1);
    window.setTimeout(() => setPulse(false), 600);
    try {
      const result = await sendCheer(profileId, type, targetId);
      setTotal(result.total);
    } catch (error) {
      setTotal((current) => Math.max(0, current - 1));
      setDone(false);
      toast.error(error instanceof Error ? error.message : "Couldn't send your cheer.");
    }
  };

  const text = readOnly ? `${total} ${total === 1 ? "cheer" : "cheers"}` : done ? `Cheered · ${total}` : `${label}${total ? ` · ${total}` : ""}`;

  return (
    <button
      type="button"
      onClick={() => void cheer()}
      disabled={readOnly || done}
      aria-label={readOnly ? `${total} cheers` : done ? `You cheered. ${total} cheers` : `${label}. ${total} cheers so far`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium transition",
        size === "sm" ? "px-3 py-1 text-sm" : "px-4 py-2 text-base",
        readOnly ? "cursor-default border-stone-200 bg-stone-50 text-stone-500"
          : done ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-stone-300 bg-white text-stone-800 hover:border-emerald-700 hover:bg-emerald-50",
        className,
      )}
    >
      <span aria-hidden="true" className={cn("inline-block transition-transform", pulse && "scale-150")}>👏</span>
      {text}
    </button>
  );
};
