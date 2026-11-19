import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usernameProblem, type ProfileInput, type ProfileRow } from "@/lib/profile";
import { ImagePicker } from "./ImagePicker";

interface ProfileEditorProps {
  profile: ProfileRow | null;
  suggestedUsername: string;
  saving: boolean;
  onSave: (input: ProfileInput) => void;
}

const toUsername = (text: string) => text.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 30);

export const ProfileEditor = ({ profile, suggestedUsername, saving, onSave }: ProfileEditorProps) => {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [runningSince, setRunningSince] = useState("");
  const [unit, setUnit] = useState<"mi" | "km">("mi");
  const [isPublic, setIsPublic] = useState(true);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [coverPath, setCoverPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUsername(profile?.username ?? toUsername(suggestedUsername));
    setDisplayName(profile?.display_name ?? "");
    setBio(profile?.bio ?? "");
    setLocation(profile?.location ?? "");
    setRunningSince(profile?.running_since?.slice(0, 4) ?? "");
    setUnit(profile?.preferred_unit ?? "mi");
    setIsPublic(profile?.is_public ?? true);
    setAvatarPath(profile?.avatar_path ?? null);
    setCoverPath(profile?.cover_path ?? null);
  }, [profile, suggestedUsername]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const problem = usernameProblem(username);
    if (problem) return setError(problem);
    if (!displayName.trim()) return setError("Add the name people should see.");
    const year = runningSince.trim();
    if (year && !/^(19|20)\d{2}$/.test(year)) return setError("Running since should be a year, like 2018.");
    setError(null);
    onSave({
      username,
      display_name: displayName.trim().slice(0, 80),
      bio: bio.trim().slice(0, 500),
      location: location.trim().slice(0, 80),
      running_since: year ? `${year}-01-01` : null,
      preferred_unit: unit,
      is_public: isPublic,
      avatar_path: avatarPath,
      cover_path: coverPath,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {!profile ? (
        <p className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-900">Create your profile to reserve your URL and start featuring runs.</p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
        <ImagePicker kind="avatar" label="Profile photo" value={avatarPath} onChange={setAvatarPath} />
        <ImagePicker kind="cover" label="Cover image" value={coverPath} onChange={setCoverPath} />
      </div>
      {(avatarPath !== (profile?.avatar_path ?? null) || coverPath !== (profile?.cover_path ?? null)) ? (
        <p className="text-sm text-amber-800">Image changes apply when you save your profile.</p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="pe-username">Profile URL</Label>
          <div className="flex items-center rounded-md border border-input bg-stone-50 pl-3 focus-within:ring-2 focus-within:ring-emerald-700">
            <span className="text-sm text-stone-500">movata.vercel.app/</span>
            <Input id="pe-username" value={username} onChange={(event) => setUsername(toUsername(event.target.value))} className="border-0 bg-transparent pl-0.5 shadow-none focus-visible:ring-0" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pe-name">Display name</Label>
          <Input id="pe-name" value={displayName} maxLength={80} onChange={(event) => setDisplayName(event.target.value)} placeholder="Dylan Rivera" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pe-location">Location</Label>
          <Input id="pe-location" value={location} maxLength={80} onChange={(event) => setLocation(event.target.value)} placeholder="Brooklyn, NY" />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="pe-bio">Bio</Label>
          <Textarea id="pe-bio" value={bio} maxLength={500} rows={3} onChange={(event) => setBio(event.target.value)} placeholder="What keeps you running?" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pe-since">Running since</Label>
          <Input id="pe-since" inputMode="numeric" value={runningSince} maxLength={4} onChange={(event) => setRunningSince(event.target.value.replace(/\D/g, ""))} placeholder="2018" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pe-unit">Units</Label>
          <Select value={unit} onValueChange={(value) => setUnit(value as "mi" | "km")}>
            <SelectTrigger id="pe-unit"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="mi">Miles</SelectItem>
              <SelectItem value="km">Kilometers</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <label htmlFor="pe-public" className="flex items-center justify-between gap-4 rounded-2xl border border-stone-200 p-3">
        <span>
          <span className="block font-medium">Public profile</span>
          <span className="block text-sm text-stone-500">Off hides your page and featured runs from everyone but you.</span>
        </span>
        <Switch id="pe-public" checked={isPublic} onCheckedChange={setIsPublic} />
      </label>
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={saving} className="rounded-full bg-emerald-700 text-white hover:bg-emerald-800">
          {saving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
          {profile ? "Save profile" : "Create profile"}
        </Button>
        {profile ? (
          <Button asChild variant="outline" className="rounded-full border-stone-300 bg-white">
            <Link to={`/${profile.username}`}>View public page<ExternalLink className="ml-2 h-4 w-4" /></Link>
          </Button>
        ) : null}
      </div>
    </form>
  );
};
