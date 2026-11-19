import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSession } from "@/contexts/SessionContext";
import {
  STRAVA_AUTO_SYNC_AFTER_MS,
  disconnectStrava,
  fetchStravaActivities,
  fetchStravaConnection,
  syncStrava,
} from "@/lib/strava";

/**
 * Everything the dashboard needs about Strava: connection status, the athlete's cached runs,
 * and sync / disconnect actions. Auto-syncs right after connecting and whenever the cache is stale.
 */
export const useStrava = () => {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const userId = user?.id;
  const autoSynced = useRef(false);

  const connection = useQuery({
    queryKey: ["strava-connection", userId],
    queryFn: () => fetchStravaConnection(userId!),
    enabled: Boolean(userId),
  });

  const connected = connection.data?.sync_status === "connected";

  const activities = useQuery({
    queryKey: ["strava-activities", userId],
    queryFn: () => fetchStravaActivities(userId!),
    enabled: Boolean(userId) && connected,
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["strava-connection", userId] });
    void queryClient.invalidateQueries({ queryKey: ["strava-activities", userId] });
  };

  const sync = useMutation({
    mutationFn: syncStrava,
    onSuccess: (result) => {
      toast.success(`Synced ${result?.synced ?? 0} runs from Strava.`);
      refresh();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Strava sync failed.");
      refresh();
    },
  });

  const disconnect = useMutation({
    mutationFn: disconnectStrava,
    onSuccess: () => {
      toast.success("Strava disconnected and your Strava data was deleted from Movata.");
      refresh();
      window.setTimeout(() => window.location.assign("/dashboard"), 1200); // resets the Connect card
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not disconnect Strava."),
  });

  // Auto-sync once per page load: right after OAuth returns, or when the cache is getting old.
  useEffect(() => {
    if (autoSynced.current || !connected || sync.isPending) return;
    const justConnected = new URLSearchParams(window.location.search).get("strava") === "connected";
    const lastSynced = connection.data?.last_synced_at ? new Date(connection.data.last_synced_at).getTime() : 0;
    if (justConnected || Date.now() - lastSynced > STRAVA_AUTO_SYNC_AFTER_MS) {
      autoSynced.current = true;
      sync.mutate();
    }
  }, [connected, connection.data?.last_synced_at, sync]);

  return {
    connection: connection.data ?? null,
    connected,
    loading: connection.isLoading || (connected && activities.isLoading),
    activities: activities.data ?? [],
    sync,
    disconnect,
  };
};
