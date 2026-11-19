import { supabase } from "@/integrations/supabase/client";

export type GearCategory = "shoes" | "apparel" | "socks" | "watch" | "hydration" | "nutrition" | "accessories" | "other";

export const GEAR_CATEGORY_LABELS: Record<GearCategory, string> = {
  shoes: "Shoes",
  apparel: "Shorts & apparel",
  socks: "Socks",
  watch: "Watch",
  hydration: "Hydration",
  nutrition: "Nutrition",
  accessories: "Accessories",
  other: "Other",
};

export interface GearRow {
  id: string;
  user_id: string;
  category: GearCategory;
  brand: string;
  name: string;
  note: string;
  photo_path: string | null;
  product_url: string | null;
  is_affiliate: boolean;
  is_gifted: boolean;
  video_url: string | null;
  in_rotation: boolean;
  position: number;
}

export type GearInput = Omit<GearRow, "id" | "user_id" | "position">;

const GEAR_COLUMNS = "id,user_id,category,brand,name,note,photo_path,product_url,is_affiliate,is_gifted,video_url,in_rotation,position";

export const blankGear = (): GearInput => ({
  category: "shoes",
  brand: "",
  name: "",
  note: "",
  photo_path: null,
  product_url: null,
  is_affiliate: false,
  is_gifted: false,
  video_url: null,
  in_rotation: true,
});

export const fetchGear = async (userId: string) => {
  const { data, error } = await supabase
    .from("gear_items")
    .select(GEAR_COLUMNS)
    .eq("user_id", userId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as GearRow[];
};

export const addGear = async (userId: string, input: GearInput, position: number) => {
  const { error } = await supabase.from("gear_items").insert({ user_id: userId, position, ...input });
  if (error) throw error;
};

export const updateGear = async (id: string, input: Partial<GearInput & { position: number }>) => {
  const { error } = await supabase.from("gear_items").update({ ...input, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
};

export const removeGear = async (id: string) => {
  const { error } = await supabase.from("gear_items").delete().eq("id", id);
  if (error) throw error;
};

/** Search-engine and browser hints for outbound gear links (FTC/Google guidance for paid links). */
export const productLinkRel = (item: Pick<GearRow, "is_affiliate" | "is_gifted">) =>
  ["noopener", "noreferrer", "nofollow", "ugc", item.is_affiliate || item.is_gifted ? "sponsored" : null].filter(Boolean).join(" ");
