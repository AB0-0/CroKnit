import { supabase } from "../../lib/supabase";

export async function fetchInventory(userId: string) {
  const { data, error } = await supabase
    .from("inventory")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createInventoryItem(
  userId: string,
  item_type: "yarn" | "hook" | "needle",
  name: string,
  size?: string,
  remaining?: number
) {
  const { data, error } = await supabase
    .from("inventory")
    .insert([{ user_id: userId, item_type, name, size, remaining }])
    .select()
    .single();

  if (error) throw error;
  return data;
}
