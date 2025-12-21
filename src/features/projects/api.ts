import { supabase } from "../../lib/supabase";

export async function fetchCategories(userId: string) {
  const { data, error } = await supabase.from("categories").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createCategory(userId: string, name: string, color?: string) {
  const { data, error } = await supabase.from("categories").insert([{ user_id: userId, name, color }]).select().single();
  if (error) throw error;
  return data;
}

export async function fetchProject(projectId: string) {
  const { data, error } = await supabase.from("projects").select("*").eq("id", projectId).single();
  if (error) throw error;
  return data;
}

export async function createProject(userId: string, categoryId: string | null, name: string) {
  const { data, error } = await supabase
    .from("projects")
    .insert([{ user_id: userId, category_id: categoryId, name }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProjectCounters(projectId: string, fields: Partial<{ row_count: number; stitch_count: number; total_time_seconds: number }>) {
  const { data, error } = await supabase.from("projects").update(fields).eq("id", projectId).select().single();
  if (error) throw error;
  return data;
}

export async function fetchProjectsByCategory(userId: string, categoryId: string) {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .eq("category_id", categoryId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}
