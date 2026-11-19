import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSession } from "@/contexts/SessionContext";
import { deleteImages } from "@/lib/images";
import { addGear, fetchGear, removeGear, updateGear, type GearInput } from "@/lib/gear";

const errorMessage = (error: unknown, fallback: string) => (error instanceof Error && error.message ? error.message : fallback);

/** The signed-in runner's Gear Corner items. */
export const useGear = (enabled: boolean) => {
  const { user } = useSession();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const queryKey = ["gear", userId];

  const gear = useQuery({ queryKey, queryFn: () => fetchGear(userId!), enabled: Boolean(userId) && enabled });
  const refresh = () => void queryClient.invalidateQueries({ queryKey });
  const find = (id: string) => gear.data?.find((item) => item.id === id);

  const add = useMutation({
    mutationFn: (input: GearInput) => addGear(userId!, input, gear.data?.length ?? 0),
    onSuccess: () => {
      toast.success("Added to your Gear Corner.");
      refresh();
    },
    onError: (error) => toast.error(errorMessage(error, "Could not add that gear.")),
  });

  const edit = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<GearInput> }) => updateGear(id, input),
    onSuccess: (_result, { id, input }) => {
      const before = find(id);
      if (before?.photo_path && input.photo_path !== undefined && input.photo_path !== before.photo_path) void deleteImages([before.photo_path]);
      toast.success("Gear saved.");
      refresh();
    },
    onError: (error) => toast.error(errorMessage(error, "Could not save that gear.")),
  });

  const remove = useMutation({
    mutationFn: removeGear,
    onSuccess: (_result, id) => {
      void deleteImages([find(id)?.photo_path]);
      toast.success("Removed from your Gear Corner.");
      refresh();
    },
    onError: (error) => toast.error(errorMessage(error, "Could not remove that gear.")),
  });

  /** Swap an item with its neighbour, then renumber the list. */
  const move = useMutation({
    mutationFn: async ({ index, direction }: { index: number; direction: -1 | 1 }) => {
      const list = [...(gear.data ?? [])];
      const other = index + direction;
      if (other < 0 || other >= list.length) return;
      [list[index], list[other]] = [list[other], list[index]];
      await Promise.all(list.map((item, position) => (item.position === position ? null : updateGear(item.id, { position }))));
    },
    onSettled: refresh,
    onError: (error) => toast.error(errorMessage(error, "Could not reorder.")),
  });

  return { gear: gear.data ?? [], loading: gear.isLoading, add, edit, remove, move };
};
