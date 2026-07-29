// Supabase Edge Function: send-nudges
// Finds users who need a nudge (via get_nudge_candidates) and emails them
// through Resend. Triggered on a schedule (see NOTIFICATIONS.md).
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.
// You must set: RESEND_API_KEY, CRON_SECRET, NUDGE_FROM, APP_URL
//   supabase secrets set RESEND_API_KEY=... CRON_SECRET=... NUDGE_FROM="NaijaCGPA <hi@yourdomain.com>" APP_URL=https://your-app.vercel.app

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET")!;
const FROM = Deno.env.get("NUDGE_FROM") ?? "NaijaCGPA <onboarding@resend.dev>";
const APP_URL = Deno.env.get("APP_URL") ?? "https://your-app.vercel.app";

Deno.serve(async (req) => {
  // Only the scheduler (which knows the secret) may trigger sends.
  if (req.headers.get("authorization") !== `Bearer ${CRON_SECRET}`) {
    return new Response("unauthorized", { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  const { data: candidates, error } = await supabase.rpc("get_nudge_candidates");
  if (error) {
    return json({ error: error.message }, 500);
  }

  let sent = 0;
  const failures: string[] = [];

  for (const c of candidates ?? []) {
    const { subject, html } = buildEmail(c);
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from: FROM, to: c.email, subject, html }),
      });
      if (res.ok) {
        sent++;
        await supabase
          .from("notification_state")
          .upsert({ user_id: c.user_id, last_nudge_at: new Date().toISOString() });
      } else {
        failures.push(`${c.email}: ${res.status}`);
      }
    } catch (e) {
      failures.push(`${c.email}: ${String(e)}`);
    }
  }

  return json({ candidates: candidates?.length ?? 0, sent, failures });
});

function buildEmail(c: { full_name: string; kind: string }) {
  const btn = (label: string) =>
    `<p style="margin:24px 0"><a href="${APP_URL}" style="background:#0F8A5F;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:700">${label}</a></p>`;

  if (c.kind === "onboarding") {
    return {
      subject: "Your CGPA won't track itself 📚",
      html:
        `<div style="font-family:Inter,Arial,sans-serif;color:#132A22;max-width:480px">` +
        `<p>Hi ${c.full_name},</p>` +
        `<p>New semester energy. Add your courses on NaijaCGPA and you'll always know where you stand — and the exact marks you need in exams to hit your target.</p>` +
        btn("Add my courses →") +
        `<p style="font-size:12px;color:#8A968F">You're getting this because you signed up for NaijaCGPA.</p></div>`,
    };
  }
  return {
    subject: "What do your exams need? Let's check 🎯",
    html:
      `<div style="font-family:Inter,Arial,sans-serif;color:#132A22;max-width:480px">` +
      `<p>Hi ${c.full_name},</p>` +
      `<p>CA scores rolling in? Update them on NaijaCGPA and see the exact exam marks you need to hit your semester target. Small steps, strong finish.</p>` +
      btn("Update my results →") +
      `<p style="font-size:12px;color:#8A968F">You're getting this because you have a NaijaCGPA account.</p></div>`,
  };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
