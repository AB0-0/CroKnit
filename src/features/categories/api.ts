import { supabase } from '../../lib/supabase';

export async function fetchCategories(userId: string) {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return data;
}

export async function createCategory(userId: string, name: string, color?: string) {
  const { data, error } = await supabase
    .from('categories')
    .insert([{ user_id: userId, name, color }])
    .select()
  if (error) throw error;
  return data?.[0];
}
