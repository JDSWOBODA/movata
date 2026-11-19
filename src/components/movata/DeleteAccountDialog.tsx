import { useEffect, useState } from "react";
import { AlertTriangle, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The runner's username, or null when they never created a profile (then they type DELETE). */
  username: string | null;
  stravaConnected: boolean;
  onDeleted: () => void;
}

const responseError = async (error: unknown) => {
  const context = (error as { context?: Response } | null)?.context;
  if (context) {
    try {
      const body = await context.clone().json() as { error?: string };
      if (body.error) return body.error;
    } catch {
      // not JSON
    }
  }
  return "Account deletion failed. Please try again.";
};

/** Permanent, self-serve account deletion with a typed confirmation. */
export const DeleteAccountDialog = ({ open, onOpenChange, username, stravaConnected, onDeleted }: DeleteAccountDialogProps) => {
  const expected = username ?? "DELETE";
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTyped("");
      setError(null);
    }
  }, [open]);

  const remove = async () => {
    setDeleting(true);
    setError(null);
    const { data, error: invokeError } = await supabase.functions.invoke<{ deleted?: boolean; error?: string }>("delete-account", { body: { confirm: typed.trim() } });
    if (invokeError || !data?.deleted) {
      setError(data?.error ?? (await responseError(invokeError)));
      setDeleting(false);
      return;
    }
    onDeleted();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!deleting) onOpenChange(next); }}>
      <DialogContent className="rounded-[1.5rem] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-800"><AlertTriangle className="h-5 w-5" />Delete your Movata account?</DialogTitle>
          <DialogDescription>This is permanent and can't be undone.</DialogDescription>
        </DialogHeader>
        <ul className="list-disc space-y-1 pl-5 text-sm text-stone-700">
          <li>Your public page{username ? <> at <span className="font-semibold">movata.vercel.app/{username}</span></> : null} disappears</li>
          <li>Featured runs, races, Gear Corner, click stats and uploaded photos are deleted</li>
          {stravaConnected ? <li>Movata's access to Strava is revoked and cached runs are deleted (your Strava account isn't affected)</li> : null}
          <li>Any Movata subscription is canceled</li>
          <li>Your username becomes available to others</li>
        </ul>
        <div className="space-y-2">
          <Label htmlFor="delete-confirm">Type <span className="font-mono font-semibold">{expected}</span> to confirm</Label>
          <Input id="delete-confirm" value={typed} autoComplete="off" onChange={(event) => setTyped(event.target.value)} disabled={deleting} />
        </div>
        {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="ghost" className="rounded-full" disabled={deleting} onClick={() => onOpenChange(false)}>Keep my account</Button>
          <Button type="button" className="rounded-full bg-red-700 text-white hover:bg-red-800" disabled={typed.trim() !== expected || deleting} onClick={() => void remove()}>
            {deleting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}Delete account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
