import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSession } from "@/contexts/SessionContext";
import { deleteImages } from "@/lib/images";
import { addRace, fetchRaces, removeRace, updateRace, type RaceInput, type RaceRow } from "@/lib/races";

const errorMessage = (error: unknown, fallback: string) => (error instanceof Error && error.message ? error.message : fallback);

/** The signed-in runner's registered, bucket-list and completed races. */
export const useRaces = (enabled: boolean) => {
  const { user } = useSession();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const queryKey = ["races", userId];

  const races = useQuery({ queryKey, queryFn: () => fetchRaces(userId!), enabled: Boolean(userId) && enabled });
  const refresh = () => void queryClient.invalidateQueries({ queryKey });
  const find = (id: string) => races.data?.find((race) => race.id === id);

  const add = useMutation({
    mutationFn: (input: RaceInput) => addRace(userId!, input, races.data?.length ?? 0),
    onSuccess: (_result, input) => {
      toast.success(input.status === "registered" ? "Race added to your calendar." : "Added to your bucket list.");
      refresh();
    },
    onError: (error) => toast.error(errorMessage(error, "Could not add that race.")),
  });

  const edit = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateRace>[1] }) => updateRace(id, input),
    onSuccess: (_result, { id, input }) => {
      const before = find(id);
      if (before?.photo_path && input.photo_path !== undefined && input.photo_path !== before.photo_path) void deleteImages([before.photo_path]);
      refresh();
    },
    onError: (error) => toast.error(errorMessage(error, "Could not update that race.")),
  });

  const remove = useMutation({
    mutationFn: removeRace,
    onSuccess: (_result, id) => {
      void deleteImages([find(id)?.photo_path]);
      toast.success("Race removed.");
      refresh();
    },
    onError: (error) => toast.error(errorMessage(error, "Could not remove that race.")),
  });

  /** Swap a bucket-list race with its neighbour, then renumber that list. */
  const move = useMutation({
    mutationFn: async ({ list, index, direction }: { list: RaceRow[]; index: number; direction: -1 | 1 }) => {
      const other = index + direction;
      if (other < 0 || other >= list.length) return;
      const reordered = [...list];
      [reordered[index], reordered[other]] = [reordered[other], reordered[index]];
      await Promise.all(reordered.map((race, position) => (race.position === position ? null : updateRace(race.id, { position }))));
    },
    onSettled: refresh,
    onError: (error) => toast.error(errorMessage(error, "Could not reorder.")),
  });

  return { races: races.data ?? [], loading: races.isLoading, add, edit, remove, move };
};
