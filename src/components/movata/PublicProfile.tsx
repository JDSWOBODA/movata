import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Copy, LoaderCircle, MapPin, QrCode, Share2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/movata/Logo";
import { RunCard } from "@/components/movata/RunCard";
import { useSession } from "@/contexts/SessionContext";
import { product } from "@/lib/brand";
import { featuredRunToActivity, fetchFeaturedRuns, type ProfileRow } from "@/lib/profile";
import { publicImageUrl } from "@/lib/images";
import { fetchRaceGoals, fetchRaces } from "@/lib/races";
import { RaceResults, visibleToPublic } from "@/components/movata/RaceResults";
import { RaceLists } from "@/components/movata/RaceLists";
import { QrCodeDialog } from "@/components/movata/QrCodeDialog";
import { LinkBlocks } from "@/components/movata/LinkBlocks";
import { fetchLinks } from "@/lib/profile-links";
import { GearCorner } from "@/components/movata/GearCorner";
import { CheerButton } from "@/components/movata/CheerButton";
import { MilestoneTimeline } from "@/components/movata/MilestoneTimeline";
import { fetchMilestones } from "@/lib/milestones";
import { cheerCount, fetchCheerCounts, trackProfileView } from "@/lib/engagement";
import { fetchGear } from "@/lib/gear";

const setMeta = (property: string, content: string) => {
  let element = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("property", property);
    document.head.appendChild(element);
  }
  element.content = content;
};

/** A real runner's public page: profile details plus the runs they chose to feature. */
export const PublicProfile = ({ profile }: { profile: ProfileRow }) => {
  const { user, loading: sessionLoading } = useSession();
  const isOwner = user?.id === profile.id;
  const name = profile.display_name || `@${profile.username}`;
  const firstName = name.split(" ")[0];
  const featured = useQuery({ queryKey: ["public-featured", profile.id], queryFn: () => fetchFeaturedRuns(profile.id) });
  const races = useQuery({ queryKey: ["public-races", profile.id], queryFn: () => fetchRaces(profile.id) });
  const raceGoals = useQuery({ queryKey: ["public-race-goals", profile.id], queryFn: () => fetchRaceGoals(profile.id) });
  // Owners preview exactly what visitors get: public races and shared goals only.
  const publicRaces = visibleToPublic(races.data ?? [], raceGoals.data ?? new Map());
  const gear = useQuery({ queryKey: ["public-gear", profile.id], queryFn: () => fetchGear(profile.id) });
  const links = useQuery({ queryKey: ["public-links", profile.id], queryFn: () => fetchLinks(profile.id) });
  const milestones = useQuery({ queryKey: ["public-milestones", profile.id], queryFn: () => fetchMilestones(profile.id) });
  const cheers = useQuery({ queryKey: ["public-cheers", profile.id], queryFn: () => fetchCheerCounts(profile.id) });
  // Owners preview what visitors see: entries awaiting review are hidden here too.
  const runs = (featured.data ?? []).filter((run) => !run.needs_review).map(featuredRunToActivity);
  const publicMilestones = (milestones.data ?? []).filter((milestone) => !milestone.needs_review);

  // Count the visit once the session is known, so owners never count their own views.
  useEffect(() => {
    if (!sessionLoading && !isOwner && profile.is_public) trackProfileView(profile.id);
  }, [sessionLoading, isOwner, profile.id, profile.is_public]);

  useEffect(() => {
    const title = `${name}'s running story · ${product.name}`;
    document.title = title;
    setMeta("og:title", title);
    setMeta("og:description", profile.bio || `Runs ${firstName} wants you to see.`);
    setMeta("og:type", "profile");
    setMeta("og:url", window.location.href);
    const image = publicImageUrl(profile.cover_path) ?? publicImageUrl(profile.avatar_path);
    if (image) setMeta("og:image", image);
  }, [name, firstName, profile.bio, profile.cover_path, profile.avatar_path]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Profile link copied");
  };
  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${name}'s running story`, url: window.location.href });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    await copyLink();
  };

  const [showQr, setShowQr] = useState(false);
  const profileUrl = `${window.location.origin}/${profile.username}`;
  const avatarUrl = publicImageUrl(profile.avatar_path);
  const coverUrl = publicImageUrl(profile.cover_path);
  const initials = name.replace("@", "").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return (
    <main className="min-h-screen bg-[#fbfaf6] text-stone-950">
      <QrCodeDialog open={showQr} onOpenChange={setShowQr} url={profileUrl} username={profile.username} title={isOwner ? "Your page as a QR code" : `${firstName}'s page as a QR code`} />
      <div className="border-b border-stone-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Logo />
          <div className="flex items-center gap-2">
            {isOwner ? <Button asChild variant="ghost" className="rounded-full"><Link to="/dashboard#highlights">Edit page</Link></Button> : null}
            <Button variant="ghost" className="hidden rounded-full sm:inline-flex" onClick={() => void copyLink()}><Copy className="mr-2 h-4 w-4" />Copy link</Button>
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="QR code" onClick={() => setShowQr(true)}><QrCode className="h-4 w-4" /></Button>
            <Button className="rounded-full bg-emerald-700 text-white hover:bg-emerald-800" onClick={() => void share()}><Share2 className="mr-2 h-4 w-4" />Share</Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-10 px-4 py-8 sm:px-6 sm:py-12">
        {isOwner && !profile.is_public ? (
          <p className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-900">Your profile is private. Only you can see this page.</p>
        ) : null}

        <section className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm">
          {coverUrl ? <img src={coverUrl} alt="" className="aspect-[3/1] w-full object-cover" /> : null}
          <div className="px-6 pb-6 sm:px-8 sm:pb-8">
          {/* Large avatar overlaps the bottom edge of the cover; name and details sit below it, clear of the image. */}
          <div className={coverUrl ? "-mt-16 sm:-mt-24" : "pt-6 sm:pt-8"}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="relative h-32 w-32 rounded-full border-[6px] border-white bg-white object-cover shadow-md sm:h-44 sm:w-44" />
            ) : (
              <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-[6px] border-white bg-emerald-700 text-4xl font-semibold text-white shadow-md sm:h-44 sm:w-44 sm:text-5xl">{initials}</div>
            )}
          </div>
          <div className="mt-4 min-w-0">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{name}</h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-stone-500">
              <span>@{profile.username}</span>
              {profile.location ? <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{profile.location}</span> : null}
              {profile.running_since ? <span className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" />Running since {profile.running_since.slice(0, 4)}</span> : null}
            </p>
          </div>
          {profile.bio ? <p className="mt-5 max-w-3xl whitespace-pre-line text-lg leading-8 text-stone-700">{profile.bio}</p> : null}
          {links.data?.length ? <div className="mt-5"><LinkBlocks links={links.data} trackClicks={!isOwner && profile.is_public} /></div> : null}
          {profile.is_public ? (
            <div className="mt-5">
              <CheerButton profileId={profile.id} type="profile" count={cheerCount(cheers.data, "profile")} readOnly={isOwner} label={`Cheer ${firstName} on`} size="md" />
            </div>
          ) : null}
          </div>
        </section>

        <section>
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Run highlights</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">The miles {firstName} wants you to see</h2>
          </div>
          {featured.isLoading ? (
            <p className="flex items-center gap-2 text-stone-500"><LoaderCircle className="h-4 w-4 animate-spin" />Loading runs…</p>
          ) : runs.length ? (
            <div className="grid gap-5 md:grid-cols-2">
              {runs.map((run) => (
                <div key={run.id} id={`run-${run.id}`} className="flex scroll-mt-6 flex-col gap-2">
                  <RunCard activity={run} unit={profile.preferred_unit} compact showPhoto className="flex-1" />
                  {profile.is_public ? <CheerButton profileId={profile.id} type="featured_run" targetId={run.id} count={cheerCount(cheers.data, "featured_run", run.id)} readOnly={isOwner} /> : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-stone-300 bg-white p-8 text-center text-stone-500">
              <Sparkles className="mx-auto h-6 w-6 text-emerald-700" />
              <p className="mt-3">{isOwner ? "Feature runs from your dashboard and they'll show up here." : `${firstName} hasn't featured any runs yet.`}</p>
              {isOwner ? <Button asChild className="mt-4 rounded-full bg-emerald-700 text-white hover:bg-emerald-800"><Link to="/dashboard#activities">Pick runs to feature</Link></Button> : null}
            </div>
          )}
        </section>

        <MilestoneTimeline milestones={publicMilestones} firstName={firstName} profileId={profile.id} cheers={profile.is_public ? cheers.data : undefined} readOnly={isOwner} />

        <RaceResults races={publicRaces.races} goals={publicRaces.goals} username={profile.username} firstName={firstName} />

        <RaceLists races={publicRaces.races} firstName={firstName} profileId={profile.id} cheers={profile.is_public ? cheers.data : undefined} readOnly={isOwner} />

        <GearCorner items={gear.data ?? []} firstName={firstName} trackClicks={!isOwner && profile.is_public} />

        <p className="text-center text-xs text-stone-400"><Link to="/privacy" className="hover:text-stone-600">Privacy &amp; Data Policy</Link></p>

        {!user ? (
          <section className="rounded-[2rem] bg-stone-950 p-6 text-white sm:p-8">
            <h2 className="text-2xl font-semibold tracking-tight">Tell your own running story.</h2>
            <p className="mt-2 text-stone-300">Reserve your {product.name} page and feature the runs that matter to you.</p>
            <Button asChild className="mt-5 rounded-full bg-white text-stone-950 hover:bg-stone-100"><Link to="/onboarding">Create your page</Link></Button>
          </section>
        ) : null}
      </div>
    </main>
  );
};
