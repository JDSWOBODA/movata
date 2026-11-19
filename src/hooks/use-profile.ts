import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSession } from "@/contexts/SessionContext";
import {
  addFeaturedRun,
  fetchFeaturedRuns,
  fetchOwnProfile,
  removeFeaturedRun,
  saveProfile,
  updateFeaturedRun,
  type FeaturedRunInput,
  type ProfileInput,
} from "@/lib/profile";

const errorMessage = (error: unknown, fallback: string) => (error instanceof Error && error.message ? error.message : fallback);

/** The signed-in runner's profile and featured runs, with save / feature / unfeature actions. */
export const useOwnProfile = () => {
  const { user } = useSession();
  const userId = user?.id;
  const queryClient = useQueryClient();

  const profile = useQuery({
    queryKey: ["own-profile", userId],
    queryFn: () => fetchOwnProfile(userId!),
    enabled: Boolean(userId),
  });

  const featured = useQuery({
    queryKey: ["featured-runs", userId],
    queryFn: () => fetchFeaturedRuns(userId!),
    enabled: Boolean(userId) && Boolean(profile.data),
  });

  const save = useMutation({
    mutationFn: (input: ProfileInput) => saveProfile(userId!, input),
    onSuccess: (row) => {
      queryClient.setQueryData(["own-profile", userId], row);
      toast.success("Profile saved.");
    },
    onError: (error) => toast.error(errorMessage(error, "Could not save your profile.")),
  });

  const refreshFeatured = () => void queryClient.invalidateQueries({ queryKey: ["featured-runs", userId] });

  const feature = useMutation({
    mutationFn: (input: FeaturedRunInput) => addFeaturedRun(userId!, input, featured.data?.length ?? 0),
    onSuccess: () => {
      toast.success("Run featured on your public page.");
      refreshFeatured();
    },
    onError: (error) => toast.error(errorMessage(error, "Could not feature that run.")),
  });

  const editFeatured = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<FeaturedRunInput> }) => updateFeaturedRun(id, input),
    onSuccess: () => {
      toast.success("Featured run updated.");
      refreshFeatured();
    },
    onError: (error) => toast.error(errorMessage(error, "Could not update that run.")),
  });

  const unfeature = useMutation({
    mutationFn: removeFeaturedRun,
    onSuccess: () => {
      toast.success("Removed from your public page.");
      refreshFeatured();
    },
    onError: (error) => toast.error(errorMessage(error, "Could not remove that run.")),
  });

  /** Swap a featured run with its neighbour to reorder the public list. */
  const move = useMutation({
    mutationFn: async ({ index, direction }: { index: number; direction: -1 | 1 }) => {
      const runs = featured.data ?? [];
      const other = index + direction;
      if (other < 0 || other >= runs.length) return;
      const reordered = [...runs];
      [reordered[index], reordered[other]] = [reordered[other], reordered[index]];
      await Promise.all(reordered.map((run, position) => (run.position === position ? null : updateFeaturedRun(run.id, { position }))));
    },
    onSettled: refreshFeatured,
    onError: (error) => toast.error(errorMessage(error, "Could not reorder.")),
  });

  return {
    profile: profile.data ?? null,
    profileLoading: profile.isLoading,
    featuredRuns: featured.data ?? [],
    save,
    feature,
    editFeatured,
    unfeature,
    move,
  };
};
