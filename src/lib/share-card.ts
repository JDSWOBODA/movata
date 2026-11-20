/** Draws shareable PNG cards (square for feeds, 9:16 for stories) entirely in the browser. */

export type CardFormat = "square" | "story";

export interface CardSpec {
  /** Small label above the headline, e.g. "Milestone" or "Race finish". */
  eyebrow: string;
  /** The big number or phrase, e.g. "2,000 mi" or "100 days". */
  headline: string;
  title: string;
  subtitle?: string;
  name: string;
  username: string;
  photoUrl?: string;
  /** Used for the downloaded file name. */
  slug: string;
}

const SIZE: Record<CardFormat, { w: number; h: number }> = { square: { w: 1080, h: 1080 }, story: { w: 1080, h: 1920 } };
const FONT = `"Inter", "Helvetica Neue", Arial, sans-serif`;
const EMERALD = "#047857";

const loadImage = (url: string) =>
  new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous"; // keeps the canvas exportable
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });

const wrap = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) => {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth || !line) line = next;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    let last = kept[maxLines - 1];
    while (ctx.measureText(`${last}…`).width > maxWidth && last.length) last = last.slice(0, -1);
    kept[maxLines - 1] = `${last}…`;
    return kept;
  }
  return lines;
};

/** Largest font size (down to a floor) at which the text fits on one line. */
const fitSize = (ctx: CanvasRenderingContext2D, text: string, weight: number, start: number, min: number, maxWidth: number) => {
  let size = start;
  while (size > min) {
    ctx.font = `${weight} ${size}px ${FONT}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 4;
  }
  return size;
};

export const renderShareCard = async (spec: CardSpec, format: CardFormat) => {
  const { w, h } = SIZE[format];
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const pad = 88;
  const photo = spec.photoUrl ? await loadImage(spec.photoUrl) : null;
  const dark = Boolean(photo);

  // Background: photo with a legibility gradient, or the brand paper colour with a route line.
  if (photo) {
    const scale = Math.max(w / photo.naturalWidth, h / photo.naturalHeight);
    const pw = photo.naturalWidth * scale;
    const ph = photo.naturalHeight * scale;
    ctx.drawImage(photo, (w - pw) / 2, (h - ph) / 2, pw, ph);
    const shade = ctx.createLinearGradient(0, 0, 0, h);
    shade.addColorStop(0, "rgba(12,10,9,0.55)");
    shade.addColorStop(0.45, "rgba(12,10,9,0.25)");
    shade.addColorStop(1, "rgba(12,10,9,0.85)");
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, w, h);
  } else {
    ctx.fillStyle = "#fbfaf6";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#a7f3d0";
    ctx.lineWidth = 14;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(pad, h * 0.2);
    ctx.bezierCurveTo(w * 0.3, h * 0.08, w * 0.45, h * 0.3, w * 0.62, h * 0.17);
    ctx.bezierCurveTo(w * 0.78, h * 0.06, w * 0.9, h * 0.2, w - pad, h * 0.14);
    ctx.stroke();
  }
  const ink = dark ? "#ffffff" : "#1c1917";
  const muted = dark ? "rgba(255,255,255,0.78)" : "#78716c";
  const accent = dark ? "#6ee7b7" : EMERALD;

  // Wordmark
  ctx.fillStyle = accent;
  ctx.font = `700 40px ${FONT}`;
  ctx.textBaseline = "top";
  ctx.fillText("Movata", pad, pad);

  // Footer: name and link, anchored to the bottom.
  const footerY = h - pad;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = ink;
  ctx.font = `700 46px ${FONT}`;
  ctx.fillText(spec.name, pad, footerY - 52);
  ctx.fillStyle = muted;
  ctx.font = `500 34px ${FONT}`;
  ctx.fillText(`movata.vercel.app/${spec.username}`, pad, footerY);

  // Main block, laid out upwards from above the footer.
  const maxWidth = w - pad * 2;
  ctx.font = `600 44px ${FONT}`;
  const titleLines = wrap(ctx, spec.title, maxWidth, format === "story" ? 4 : 3);
  const subtitleLines = spec.subtitle ? (ctx.font = `500 36px ${FONT}`, wrap(ctx, spec.subtitle, maxWidth, 2)) : [];
  const headlineSize = fitSize(ctx, spec.headline, 800, format === "story" ? 260 : 220, 96, maxWidth);

  let y = footerY - 52 - 120;
  ctx.fillStyle = muted;
  ctx.font = `500 36px ${FONT}`;
  for (const line of [...subtitleLines].reverse()) {
    ctx.fillText(line, pad, y);
    y -= 48;
  }
  if (subtitleLines.length) y -= 12;
  ctx.fillStyle = ink;
  ctx.font = `600 44px ${FONT}`;
  for (const line of [...titleLines].reverse()) {
    ctx.fillText(line, pad, y);
    y -= 58;
  }
  y -= 24;
  ctx.fillStyle = dark ? "#ffffff" : "#065f46";
  ctx.font = `800 ${headlineSize}px ${FONT}`;
  ctx.fillText(spec.headline, pad - headlineSize * 0.04, y);
  y -= headlineSize + 18;
  ctx.fillStyle = accent;
  ctx.font = `700 34px ${FONT}`;
  ctx.fillText(spec.eyebrow.toUpperCase(), pad, y);

  return canvas;
};

export const canvasToFile = (canvas: HTMLCanvasElement, name: string) =>
  new Promise<File>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(new File([blob], name, { type: "image/png" })) : reject(new Error("Couldn't create the image."))), "image/png");
  });
