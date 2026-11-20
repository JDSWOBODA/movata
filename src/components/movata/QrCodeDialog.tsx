import { useMemo } from "react";
import { Copy, Download, QrCode } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { qrSvg } from "@/lib/qr";

interface QrCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  /** Used in the dialog title and file names, e.g. "dylan". */
  username: string;
  title?: string;
}

const download = (href: string, filename: string) => {
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  link.click();
};

/** QR code for a profile (or race) link: print it on a bib, a race-day sign or a slide. */
export const QrCodeDialog = ({ open, onOpenChange, url, username, title = "Your page as a QR code" }: QrCodeDialogProps) => {
  const svg = useMemo(() => (open ? qrSvg(url) : ""), [open, url]);
  const svgUrl = useMemo(() => (svg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}` : ""), [svg]);

  const downloadPng = () => {
    const image = new Image();
    image.onload = () => {
      const size = 1200;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.imageSmoothingEnabled = false;
      context.drawImage(image, 0, 0, size, size);
      download(canvas.toDataURL("image/png"), `${username}-movata-qr.png`);
    };
    image.src = svgUrl;
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    toast.success("Link copied");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[1.5rem] sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><QrCode className="h-5 w-5 text-emerald-700" />{title}</DialogTitle>
          <DialogDescription>Scan to open <span className="font-medium text-stone-800">{url.replace(/^https?:\/\//, "")}</span></DialogDescription>
        </DialogHeader>
        {svgUrl ? <img src={svgUrl} alt={`QR code for ${url}`} className="mx-auto aspect-square w-64 rounded-2xl border border-stone-200" /> : null}
        <div className="grid grid-cols-2 gap-2">
          <Button className="rounded-full bg-emerald-700 text-white hover:bg-emerald-800" onClick={downloadPng}><Download className="mr-2 h-4 w-4" />PNG</Button>
          <Button variant="outline" className="rounded-full" onClick={() => download(svgUrl, `${username}-movata-qr.svg`)}><Download className="mr-2 h-4 w-4" />SVG</Button>
          <Button variant="ghost" className="col-span-2 rounded-full" onClick={() => void copyLink()}><Copy className="mr-2 h-4 w-4" />Copy link</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
