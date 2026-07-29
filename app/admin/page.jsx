import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "NaijaCGPA — Admin" };

export default async function AdminPage() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return <Gate title="Not connected" msg="Add your Supabase keys (see SETUP.md) first." />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <Gate title="Sign in required" msg="Sign in with an admin account to view this page." />;

  const { data, error } = await supabase.rpc("get_admin_stats");
  if (error || !data) {
    return <Gate title="No access" msg="This account isn't on the admin allowlist." />;
  }

  const days = data.signups_by_day || [];
  const maxCount = Math.max(1, ...days.map((d) => d.count));

  return (
    <main style={s.page}>
      <div style={s.head}>
        <h1 style={s.h1}>Dashboard</h1>
        <Link href="/" style={s.back}>← Back to app</Link>
      </div>

      <div style={s.grid}>
        <Stat label="Total registered" value={data.total_users} accent="#0F8A5F" />
        <Stat label="New in 24h" value={data.users_24h} />
        <Stat label="New in 7 days" value={data.users_7d} />
        <Stat label="Results saved" value={data.total_results} accent="#E8B23A" />
      </div>

      <div style={s.card}>
        <div style={s.cardLabel}>Sign-ups · last 14 days</div>
        {days.length === 0 ? (
          <p style={s.empty}>No sign-ups yet. Share the link and check back.</p>
        ) : (
          <div style={s.chart}>
            {days.map((d) => (
              <div key={d.day} style={s.barCol} title={`${d.day}: ${d.count}`}>
                <div
                  style={{
                    ...s.bar,
                    height: `${Math.round((d.count / maxCount) * 100)}%`,
                  }}
                />
                <span style={s.barDay}>
                  {new Date(d.day).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value, accent = "#132A22" }) {
  return (
    <div style={s.stat}>
      <div style={{ ...s.statValue, color: accent }}>{value ?? 0}</div>
      <div style={s.statLabel}>{label}</div>
    </div>
  );
}

function Gate({ title, msg }) {
  return (
    <main style={s.gate}>
      <h1 style={s.gateTitle}>{title}</h1>
      <p style={s.gateMsg}>{msg}</p>
      <Link href="/" style={s.back}>← Back to app</Link>
    </main>
  );
}

const mono = "'JetBrains Mono', ui-monospace, monospace";
const s = {
  page: { maxWidth: 720, margin: "0 auto", padding: 20, fontFamily: "Inter, system-ui, sans-serif", color: "#132A22" },
  head: { display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18 },
  h1: { fontSize: 26, fontWeight: 800, margin: 0, color: "#0B1F18" },
  back: { fontSize: 13, color: "#0F8A5F", textDecoration: "none", fontWeight: 600 },
  grid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 },
  stat: { background: "#fff", border: "1px solid #E2E7E2", borderRadius: 16, padding: 18 },
  statValue: { fontFamily: mono, fontSize: 40, fontWeight: 700, lineHeight: 1 },
  statLabel: { fontSize: 13, color: "#5B6B62", marginTop: 6, fontWeight: 600 },
  card: { background: "#fff", border: "1px solid #E2E7E2", borderRadius: 16, padding: 18, marginTop: 12 },
  cardLabel: { fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "#5B6B62", fontWeight: 700, marginBottom: 16 },
  chart: { display: "flex", alignItems: "flex-end", gap: 8, height: 160 },
  barCol: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" },
  bar: { width: "100%", maxWidth: 34, minHeight: 4, background: "linear-gradient(#12B76A,#0F8A5F)", borderRadius: "6px 6px 0 0" },
  barDay: { fontSize: 10, color: "#8A968F", marginTop: 6, whiteSpace: "nowrap" },
  empty: { color: "#5B6B62", fontSize: 14, margin: 0 },
  gate: { maxWidth: 480, margin: "80px auto", padding: 24, textAlign: "center", fontFamily: "Inter, system-ui, sans-serif" },
  gateTitle: { fontSize: 22, color: "#0B1F18", margin: "0 0 8px" },
  gateMsg: { color: "#5B6B62", margin: "0 0 20px" },
};
