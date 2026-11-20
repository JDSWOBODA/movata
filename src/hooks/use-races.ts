import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSession } from "@/contexts/SessionContext";
import { deleteImages } from "@/lib/images";
import { isNewPr } from "@/lib/race-results";
import {
  addRace,
  fetchRaceGoals,
  fetchRaces,
  removeRace,
  saveRaceGoal,
  updateRace,
  type RaceGoalInput,
  type RaceInput,
  type RaceRow,
} from "@/lib/races";

const errorMessage = (error: unknown, fallback: string) => (error instanceof Error && error.message ? error.message : fallback);

export interface SavedRace {
  race: RaceRow;
  /** True when this result is now the runner's fastest at its distance. */
  newPr: boolean;
}

/** The signed-in runner's registered, bucket-list and finished races, plus their goals. */
export const useRaces = (enabled: boolean) => {
  const { user } = useSession();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const queryKey = ["races", userId];
  const goalsKey = ["race-goals", userId];

  const races = useQuery({ queryKey, queryFn: () => fetchRaces(userId!), enabled: Boolean(userId) && enabled });
  const goals = useQuery({ queryKey: goalsKey, queryFn: () => fetchRaceGoals(userId!), enabled: Boolean(userId) && enabled });
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey });
    void queryClient.invalidateQueries({ queryKey: goalsKey });
  };
  const find = (id: string) => races.data?.find((race) => race.id === id);

  const add = useMutation({
    mutationFn: async ({ input, goal }: { input: RaceInput & { completed_on?: string | null }; goal?: RaceGoalInput }): Promise<SavedRace> => {
      const race = await addRace(userId!, input, races.data?.length ?? 0);
      if (goal?.goal_seconds) await saveRaceGoal(userId!, race.id, goal);
      return { race, newPr: isNewPr(race, [...(races.data ?? []), race]) };
    },
    // The dashboard shows the confirmation (it can offer a share card for a new PR).
    onSuccess: refresh,
    onError: (error) => toast.error(errorMessage(error, "Could not add that race.")),
  });

  const edit = useMutation({
    mutationFn: async ({ id, input, goal }: { id: string; input: Parameters<typeof updateRace>[1]; goal?: RaceGoalInput }): Promise<SavedRace | null> => {
      await updateRace(id, input);
      if (goal) await saveRaceGoal(userId!, id, goal);
      const before = find(id);
      if (!before) return null;
      const race = { ...before, ...input } as RaceRow;
      const resultChanged = input.finish_seconds !== undefined && input.finish_seconds !== before.finish_seconds;
      return { race, newPr: resultChanged && isNewPr(race, (races.data ?? []).map((r) => (r.id === id ? race : r))) };
    },
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

  return { races: races.data ?? [], goals: goals.data ?? new Map(), loading: races.isLoading, add, edit, remove, move };
};
