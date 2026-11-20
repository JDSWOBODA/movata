import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSession } from "@/contexts/SessionContext";
import { addLink, fetchLinkClickStats, fetchLinks, removeLink, updateLink, type ProfileLinkInput, type ProfileLinkRow } from "@/lib/profile-links";

const errorMessage = (error: unknown, fallback: string) => (error instanceof Error && error.message ? error.message : fallback);

/** The signed-in runner's profile links and their visitor click counts. */
export const useLinks = (enabled: boolean) => {
  const { user } = useSession();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const queryKey = ["profile-links", userId];

  const links = useQuery({ queryKey, queryFn: () => fetchLinks(userId!), enabled: Boolean(userId) && enabled });
  const stats = useQuery({ queryKey: ["link-click-stats", userId], queryFn: fetchLinkClickStats, enabled: Boolean(userId) && enabled });
  const refresh = () => void queryClient.invalidateQueries({ queryKey });

  const add = useMutation({
    mutationFn: (input: ProfileLinkInput) => addLink(userId!, input, links.data?.length ?? 0),
    onSuccess: () => { toast.success("Link added to your page."); refresh(); },
    onError: (error) => toast.error(errorMessage(error, "Could not add that link.")),
  });

  const edit = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ProfileLinkInput> }) => updateLink(id, input),
    onSuccess: () => { toast.success("Link saved."); refresh(); },
    onError: (error) => toast.error(errorMessage(error, "Could not save that link.")),
  });

  const remove = useMutation({
    mutationFn: removeLink,
    onSuccess: () => { toast.success("Link removed."); refresh(); },
    onError: (error) => toast.error(errorMessage(error, "Could not remove that link.")),
  });

  /** Swap a link with its neighbour, then renumber the list. */
  const move = useMutation({
    mutationFn: async ({ index, direction }: { index: number; direction: -1 | 1 }) => {
      const list = [...(links.data ?? [])];
      const other = index + direction;
      if (other < 0 || other >= list.length) return;
      [list[index], list[other]] = [list[other], list[index]];
      await Promise.all(list.map((link: ProfileLinkRow, position) => (link.position === position ? null : updateLink(link.id, { position }))));
    },
    onSettled: refresh,
    onError: (error) => toast.error(errorMessage(error, "Could not reorder.")),
  });

  return { links: links.data ?? [], stats: stats.data ?? new Map(), loading: links.isLoading, add, edit, remove, move };
};
