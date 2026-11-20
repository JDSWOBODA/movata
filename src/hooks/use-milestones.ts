import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSession } from "@/contexts/SessionContext";
import { deleteImages } from "@/lib/images";
import {
  addMilestone, dismissMilestone, fetchDismissedMilestones, fetchMilestones, removeMilestone, updateMilestone,
  type MilestoneInput,
} from "@/lib/milestones";

const errorMessage = (error: unknown, fallback: string) => (error instanceof Error && error.message ? error.message : fallback);

/** The signed-in runner's published milestones and dismissed suggestions. */
export const useMilestones = (enabled: boolean) => {
  const { user } = useSession();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const listKey = ["milestones", userId];
  const dismissedKey = ["milestone-dismissals", userId];

  const list = useQuery({ queryKey: listKey, queryFn: () => fetchMilestones(userId!), enabled: Boolean(userId) && enabled });
  const dismissed = useQuery({ queryKey: dismissedKey, queryFn: () => fetchDismissedMilestones(userId!), enabled: Boolean(userId) && enabled });
  const refresh = () => void queryClient.invalidateQueries({ queryKey: listKey });
  const find = (id: string) => list.data?.find((item) => item.id === id);

  const add = useMutation({
    mutationFn: (input: MilestoneInput) => addMilestone(userId!, input),
    onSuccess: () => { toast.success("Milestone added to your page."); refresh(); },
    onError: (error) => toast.error(errorMessage(error, "Could not add that milestone.")),
  });

  const edit = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<MilestoneInput> }) => updateMilestone(id, input),
    onSuccess: (_result, { id, input }) => {
      const before = find(id);
      if (before?.photo_path && input.photo_path !== undefined && input.photo_path !== before.photo_path) void deleteImages([before.photo_path]);
      toast.success("Milestone saved.");
      refresh();
    },
    onError: (error) => toast.error(errorMessage(error, "Could not save that milestone.")),
  });

  const remove = useMutation({
    mutationFn: removeMilestone,
    onSuccess: (_result, id) => { void deleteImages([find(id)?.photo_path]); toast.success("Milestone removed."); refresh(); },
    onError: (error) => toast.error(errorMessage(error, "Could not remove that milestone.")),
  });

  const dismiss = useMutation({
    mutationFn: (key: string) => dismissMilestone(userId!, key),
    onMutate: (key) => {
      queryClient.setQueryData<Set<string>>(dismissedKey, (current) => new Set([...(current ?? []), key]));
    },
    onError: (error) => {
      void queryClient.invalidateQueries({ queryKey: dismissedKey });
      toast.error(errorMessage(error, "Could not dismiss that suggestion."));
    },
  });

  return { milestones: list.data ?? [], dismissed: dismissed.data ?? new Set<string>(), add, edit, remove, dismiss };
};
