import { supabase } from "../lib/supabase";

/* Categories */
export async function fetchCategories(userId: string) {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createCategory(userId: string, name: string, color?: string) {
  const { data, error } = await supabase
    .from("categories")
    .insert([{ user_id: userId, name, color }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchCategory(categoryId: string) {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", categoryId)
    .single();
  if (error) throw error;
  return data;
}

/* Projects */
export async function fetchProjectsByCategory(userId: string, categoryId: string) {
  let q = supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .eq("category_id", categoryId)
    .order("created_at", { ascending: false });

  q = q.or("archived.eq.false,archived.is.null");

  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function fetchAllProjects(userId: string, archived?: boolean) {
  let q = supabase.from("projects").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (archived === true) {
    q = q.eq("archived", true);
  } else if (archived === false) {
    q = q.or("archived.eq.false,archived.is.null");
  }

  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function createProject(userId: string, categoryId: string | null, name: string, tag?: string | null) {
  const payload: any = { user_id: userId, category_id: categoryId, name, archived: false };
  if (tag) payload.tag = tag;
  const { data, error } = await supabase
    .from("projects")
    .insert([payload])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchProject(projectId: string) {
  const { data, error } = await supabase.from("projects").select("*").eq("id", projectId).single();
  if (error) throw error;
  return data;
}

export async function updateProjectCounters(projectId: string, fields: Partial<{ row_count: number; stitch_count: number; total_time_seconds: number }>) {
  const { data, error } = await supabase.from("projects").update(fields).eq("id", projectId).select().single();
  if (error) throw error;
  return data;
}

/* Inventory */
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
  remaining?: number,
  opts?: { color?: string | null; yarn_type?: string | null; size_mm?: number | null }
) {
  const payload: any = { user_id: userId, item_type, name, size, remaining };
  if (opts?.color) payload.color = opts.color;
  if (opts?.yarn_type) payload.yarn_type = opts.yarn_type;
  if (typeof opts?.size_mm === "number") payload.size_mm = opts.size_mm;

  const { data, error } = await supabase
    .from("inventory")
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
}
