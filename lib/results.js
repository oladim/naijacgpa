// CRUD helpers for saved results. RLS scopes everything to the current user,
// so no query here has to filter by user_id manually (except the insert, which
// must set it so the WITH CHECK policy passes).
import { createClient } from "@/lib/supabase/client";

/**
 * @param {{
 *   title?: string, level: string, scale: string,
 *   cgpa: number|null, className: string, unitsCounted: number,
 *   payload: object
 * }} snapshot
 */
export async function saveResult(snapshot) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in to save your result.");

  const row = {
    user_id: user.id,
    title: snapshot.title || "My result",
    level: snapshot.level,
    scale: snapshot.scale,
    cgpa: snapshot.cgpa,
    class_name: snapshot.className,
    units_counted: snapshot.unitsCounted,
    payload: snapshot.payload,
  };

  const { data, error } = await supabase
    .from("results")
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listResults() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("results")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function deleteResult(id) {
  const supabase = createClient();
  const { error } = await supabase.from("results").delete().eq("id", id);
  if (error) throw error;
}
