import { Activity, AtSign, Camera, ClipboardList, Link2, Mail, Mic, Play, ShoppingBag, Users, type LucideIcon } from "lucide-react";
import { linkHost } from "@/lib/links";
import { trackLinkClick, type LinkKind, type ProfileLinkRow } from "@/lib/profile-links";

export const LINK_ICONS: Record<LinkKind, LucideIcon> = {
  link: Link2,
  instagram: Camera,
  tiktok: Play,
  youtube: Play,
  strava: Activity,
  x: AtSign,
  threads: AtSign,
  facebook: Users,
  podcast: Mic,
  newsletter: Mail,
  shop: ShoppingBag,
  coaching: ClipboardList,
};

interface LinkBlocksProps {
  links: ProfileLinkRow[];
  /** Count visitor clicks (off for the owner so they don't count themselves). */
  trackClicks: boolean;
}

/** The runner's links as tappable blocks under their profile header. */
export const LinkBlocks = ({ links, trackClicks }: LinkBlocksProps) => {
  if (!links.length) return null;
  const report = (id: string) => { if (trackClicks) trackLinkClick(id); };
  return (
    <nav aria-label="Links" className="grid gap-2 sm:grid-cols-2">
      {links.map((link) => {
        const Icon = LINK_ICONS[link.kind] ?? Link2;
        return (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer nofollow ugc"
            onClick={() => report(link.id)}
            onAuxClick={(event) => { if (event.button === 1) report(link.id); }}
            className="group flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 group-hover:bg-emerald-700 group-hover:text-white"><Icon className="h-4 w-4" /></span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-stone-900">{link.label}</span>
              <span className="block truncate text-xs text-stone-500">{linkHost(link.url)}</span>
            </span>
          </a>
        );
      })}
    </nav>
  );
};
