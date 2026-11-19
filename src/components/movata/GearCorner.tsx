import type { GearRow } from "@/lib/gear";
import { GearCard } from "./GearCard";

/** Public Gear Corner: current rotation first, then past favorites. */
export const GearCorner = ({ items, firstName }: { items: GearRow[]; firstName: string }) => {
  if (!items.length) return null;
  const current = items.filter((item) => item.in_rotation);
  const past = items.filter((item) => !item.in_rotation);
  const disclosed = items.some((item) => (item.product_url && item.is_affiliate) || item.is_gifted);

  return (
    <section id="gear">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Gear Corner</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">What {firstName} runs in</h2>
        </div>
        {disclosed ? <p className="max-w-md text-sm text-stone-500">Some links are affiliate links or gifted gear; each is labeled on its card.</p> : null}
      </div>
      {current.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{current.map((item) => <GearCard key={item.id} item={item} />)}</div>
      ) : null}
      {past.length ? (
        <>
          <h3 className="mb-3 mt-8 font-semibold text-stone-700">Past favorites</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{past.map((item) => <GearCard key={item.id} item={item} />)}</div>
        </>
      ) : null}
    </section>
  );
};
