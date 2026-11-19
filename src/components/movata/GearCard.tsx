import type { ReactNode } from "react";
import { ExternalLink, Gift, PlayCircle, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { publicImageUrl } from "@/lib/images";
import { GEAR_CATEGORY_LABELS, productLinkRel, type GearRow } from "@/lib/gear";
import { linkHost } from "@/lib/links";

interface GearCardProps {
  item: GearRow;
  /** Owner controls rendered under the card on the dashboard. */
  actions?: ReactNode;
}

/** One Gear Corner item, with its disclosures shown right next to the links they apply to. */
export const GearCard = ({ item, actions }: GearCardProps) => {
  const photo = publicImageUrl(item.photo_path);
  return (
    <article className="flex flex-col overflow-hidden rounded-[1.4rem] border border-stone-200 bg-white shadow-sm">
      {photo ? (
        <img src={photo} alt={[item.brand, item.name].filter(Boolean).join(" ")} loading="lazy" className="aspect-square w-full bg-stone-50 object-cover" />
      ) : (
        <div className="flex aspect-[2/1] w-full items-center justify-center bg-stone-50 text-stone-300"><ShoppingBag className="h-10 w-10" /></div>
      )}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="rounded-full bg-emerald-50 text-[11px] text-emerald-800 hover:bg-emerald-50">{GEAR_CATEGORY_LABELS[item.category]}</Badge>
          {!item.in_rotation ? <Badge variant="outline" className="rounded-full text-[11px] text-stone-500">Past favorite</Badge> : null}
        </div>
        {item.brand ? <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">{item.brand}</p> : null}
        <h3 className="text-lg font-semibold leading-tight tracking-tight">{item.name}</h3>
        {item.note ? <p className="mt-2 text-sm leading-6 text-stone-600">{item.note}</p> : null}

        {item.product_url || item.video_url || item.is_gifted ? (
          <div className="mt-auto space-y-2 pt-4">
            <div className="flex flex-wrap gap-2">
              {item.product_url ? (
                <a href={item.product_url} target="_blank" rel={productLinkRel(item)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-800">
                  View product<ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}
              {item.video_url ? (
                <a href={item.video_url} target="_blank" rel="noopener noreferrer nofollow ugc"
                  className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 px-3 py-1.5 text-sm font-medium hover:bg-stone-50">
                  <PlayCircle className="h-4 w-4" />Watch review
                </a>
              ) : null}
            </div>
            <div className="space-y-0.5 text-xs text-stone-500">
              {item.product_url && item.is_affiliate ? <p><span className="font-semibold text-stone-700">Affiliate link:</span> the runner may earn a commission from purchases ({linkHost(item.product_url)}).</p> : null}
              {item.is_gifted ? <p className="flex items-start gap-1"><Gift className="mt-px h-3.5 w-3.5 shrink-0" /><span><span className="font-semibold text-stone-700">Gifted or sponsored</span> by the brand.</span></p> : null}
            </div>
          </div>
        ) : null}
        {actions ? <div className="mt-4 border-t border-stone-100 pt-3">{actions}</div> : null}
      </div>
    </article>
  );
};
