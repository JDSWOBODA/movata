import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// link-preview (signed-in runners only; verify_jwt = true)
// POST { url }                      → { title, description, siteName, image } from the page's Open Graph tags
// POST { url, mode: "image" }       → the image bytes, so the browser can resize/crop and upload them
//
// Fetching arbitrary URLs server-side is risky, so: http(s) only, standard ports, no IP literals
// in private ranges or local hostnames (checked again on every redirect), 8 s timeout, and size caps.

const functionName = "link-preview";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const TIMEOUT_MS = 8000;
const MAX_HTML_BYTES = 1_500_000;
const MAX_IMAGE_BYTES = 8_000_000;
const MAX_REDIRECTS = 4;
const USER_AGENT = "Mozilla/5.0 (compatible; MovataLinkPreview/1.0; +https://movata.vercel.app)";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

class PreviewError extends Error {}

const isPrivateHost = (hostname: string) => {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal") || !host.includes(".") && !host.includes(":")) return true;
  const v4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  if (host.includes(":")) return host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80") || host === "::";
  return false;
};

const checkUrl = (raw: string) => {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new PreviewError("That isn't a valid link.");
  }
  if (!["http:", "https:"].includes(url.protocol)) throw new PreviewError("Only http and https links are supported.");
  if (url.port && !["80", "443"].includes(url.port)) throw new PreviewError("That link uses an unsupported port.");
  if (url.username || url.password || isPrivateHost(url.hostname)) throw new PreviewError("That link can't be previewed.");
  return url;
};

/** fetch with manual redirects so every hop is re-checked, plus a timeout. */
const safeFetch = async (start: URL, accept: string) => {
  let url = start;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "User-Agent": USER_AGENT, Accept: accept, "Accept-Language": "en" },
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      await response.body?.cancel();
      if (!location) throw new PreviewError("The site redirected without a destination.");
      url = checkUrl(new URL(location, url).toString());
      continue;
    }
    return { response, finalUrl: url };
  }
  throw new PreviewError("Too many redirects.");
};

const readCapped = async (response: Response, max: number) => {
  const declared = Number(response.headers.get("content-length") ?? 0);
  if (declared > max) throw new PreviewError("That file is too large to preview.");
  const reader = response.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > max) {
      await reader.cancel();
      if (max === MAX_HTML_BYTES) break; // meta tags live in <head>; a truncated page is fine
      throw new PreviewError("That image is too large.");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(Math.min(total, max));
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk.subarray(0, Math.min(chunk.length, bytes.length - offset)), offset);
    offset += chunk.length;
    if (offset >= bytes.length) break;
  }
  return bytes;
};

const decodeEntities = (text: string) =>
  text
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_m, code) => String.fromCharCode(parseInt(code, 16)))
    .trim();

/** Read <meta property|name="…" content="…"> in either attribute order. */
const metaContent = (html: string, keys: string[]) => {
  for (const key of keys) {
    const escaped = key.replace(/[.:]/g, "\\$&");
    const patterns = [
      new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]*content=["']([^"']+)["']`, "i"),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${escaped}["']`, "i"),
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) return decodeEntities(match[1]);
    }
  }
  return null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  const authClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
  const { data: userData } = await authClient.auth.getUser(authHeader.replace(/^Bearer /, ""));
  if (!userData?.user) return json({ error: "Sign in to fetch link previews." }, 401);

  const body = await req.json().catch(() => null) as { url?: string; mode?: string } | null;
  try {
    const target = checkUrl(String(body?.url ?? "").trim());

    if (body?.mode === "image") {
      const { response } = await safeFetch(target, "image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8");
      if (!response.ok) throw new PreviewError(`The image couldn't be downloaded (${response.status}).`);
      const type = (response.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
      if (!type.startsWith("image/") || type === "image/svg+xml") throw new PreviewError("That link isn't a supported image.");
      const bytes = await readCapped(response, MAX_IMAGE_BYTES);
      return new Response(bytes, { headers: { ...corsHeaders, "Content-Type": type, "Cache-Control": "no-store" } });
    }

    const { response, finalUrl } = await safeFetch(target, "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5");
    if (!response.ok) throw new PreviewError(`The site responded with ${response.status}. Try uploading a photo instead.`);
    const type = (response.headers.get("content-type") ?? "").toLowerCase();
    if (type.startsWith("image/")) {
      await response.body?.cancel();
      return json({ title: null, description: null, siteName: finalUrl.hostname.replace(/^www\./, ""), image: finalUrl.toString() });
    }
    if (!type.includes("html")) throw new PreviewError("That link isn't a web page.");
    const html = new TextDecoder().decode(await readCapped(response, MAX_HTML_BYTES));

    const rawImage = metaContent(html, ["og:image:secure_url", "og:image", "og:image:url", "twitter:image", "twitter:image:src"]);
    let image: string | null = null;
    if (rawImage) {
      try {
        const resolved = new URL(rawImage, finalUrl);
        if (["http:", "https:"].includes(resolved.protocol) && !isPrivateHost(resolved.hostname)) image = resolved.toString();
      } catch {
        image = null;
      }
    }
    const title = metaContent(html, ["og:title", "twitter:title"]) ?? (html.match(/<title[^>]*>([^<]{1,300})<\/title>/i)?.[1] ? decodeEntities(html.match(/<title[^>]*>([^<]{1,300})<\/title>/i)![1]) : null);
    return json({
      title: title?.slice(0, 200) ?? null,
      description: metaContent(html, ["og:description", "twitter:description", "description"])?.slice(0, 400) ?? null,
      siteName: metaContent(html, ["og:site_name"]) ?? finalUrl.hostname.replace(/^www\./, ""),
      image,
    });
  } catch (error) {
    const message = error instanceof PreviewError ? error.message
      : error instanceof DOMException && error.name === "TimeoutError" ? "The site took too long to respond."
      : "Couldn't read that link. Try uploading a photo instead.";
    if (!(error instanceof PreviewError)) console.warn(`[${functionName}] Preview failed`, String(error));
    return json({ error: message }, 422);
  }
});
