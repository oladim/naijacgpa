// CRUD helpers for saved results. RLS scopes everything to the current user,
// so no query here has to filter by user_id manually (except the insert, which
// must set it so the WITH CHECK policy passes).
import { createClient } from "@/lib/supabase/client";

// ---- Per-user working state (one evolving row, upserted) ----
// Splits the calculator's data into the three JSON fields you asked for:
// current courses, previous semesters, and graduation target (+ meta).

export async function saveState({ cgpa, className, draft }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in to save your data.");

  const d = draft || {};
  const row = {
    user_id: user.id,
    current_courses: d.courses ?? [],
    previous_semesters: d.priorSemesters ?? [],
    graduation_target: {
      targetShort: d.targetShort ?? null,
      unitsRemaining: d.unitsRemaining ?? "",
      remainingCourses: d.remainingCourses ?? [],
    },
    meta: {
      level: d.level,
      scale: d.scale,
      inputMode: d.inputMode,
      name: d.name,
      expungeFailedCarryovers: d.expungeFailedCarryovers,
      caWeight: d.caWeight,
      semTargetGpa: d.semTargetGpa,
    },
    cgpa: cgpa ?? null,
    class_name: className ?? null,
  };

  const { data, error } = await supabase
    .from("user_state")
    .upsert(row, { onConflict: "user_id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Returns { draft, updatedAt } reconstructed into the flat shape the calculator
// hydrates from, or null if the user has no saved state yet.
export async function loadState() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("user_state")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const gt = data.graduation_target || {};
  const meta = data.meta || {};
  return {
    updatedAt: data.updated_at,
    draft: {
      level: meta.level,
      scale: meta.scale,
      inputMode: meta.inputMode,
      name: meta.name,
      expungeFailedCarryovers: meta.expungeFailedCarryovers,
      caWeight: meta.caWeight,
      semTargetGpa: meta.semTargetGpa,
      courses: data.current_courses || [],
      priorSemesters: data.previous_semesters || [],
      targetShort: gt.targetShort || undefined,
      unitsRemaining: typeof gt.unitsRemaining === "string" ? gt.unitsRemaining : "",
      remainingCourses: gt.remainingCourses || [],
    },
  };
}


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
