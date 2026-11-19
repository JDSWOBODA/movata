import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * In-page confirmation. Used instead of window.confirm(), which embedded browsers can
 * suppress (it silently returns false, so the action never runs).
 */
export const ConfirmDialog = ({ open, title, description, confirmLabel, onConfirm, onCancel }: ConfirmDialogProps) => (
  <AlertDialog open={open} onOpenChange={(next) => { if (!next) onCancel(); }}>
    <AlertDialogContent className="rounded-[1.5rem]">
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
        <AlertDialogAction className="rounded-full bg-red-700 text-white hover:bg-red-800" onClick={onConfirm}>{confirmLabel}</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
