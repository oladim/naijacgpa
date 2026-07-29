"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { saveResult, listResults, deleteResult } from "@/lib/results";
import { localDraft } from "@/lib/localDraft";
import AuthButton from "@/components/AuthButton";
import CgpaCalculator from "@/components/CgpaCalculator";

export default function Home() {
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [results, setResults] = useState([]);

  const refresh = useCallback(async () => {
    try {
      setResults(await listResults());
    } catch {
      setResults([]);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      if (data.user) refresh();
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) refresh();
      else setResults([]);
    });
    return () => sub.subscription.unsubscribe();
  }, [refresh]);

  const handleSave = async (snapshot) => {
    if (!isSupabaseConfigured) {
      alert("Connect Supabase (see SETUP.md) to enable saving.");
      return;
    }
    setSaving(true);
    try {
      await saveResult(snapshot);
      await refresh();
      alert("Saved to your account.");
    } catch (e) {
      // Not signed in → send them through Google, then they can save.
      if (/sign in/i.test(e.message)) {
        await createClient().auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: `${window.location.origin}/auth/callback` },
        });
      } else {
        alert(e.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    await deleteResult(id);
    refresh();
  };

  return (
    <main style={s.page}>
      <header style={s.header}>
        <AuthButton />
      </header>

      <CgpaCalculator onSave={handleSave} saving={saving} storage={localDraft} />

      {user && results.length > 0 && (
        <section style={s.saved}>
          <h2 style={s.savedTitle}>Your saved results</h2>
          {results.map((r) => (
            <div key={r.id} style={s.row}>
              <div>
                <div style={s.rowTitle}>{r.title}</div>
                <div style={s.rowMeta}>
                  {r.cgpa ?? "—"} · {r.class_name} ·{" "}
                  {new Date(r.created_at).toLocaleDateString()}
                </div>
              </div>
              <button style={s.del} onClick={() => handleDelete(r.id)}>
                Delete
              </button>
            </div>
          ))}
        </section>
      )}

      <footer style={s.footer}>
        <Link href="/privacy" style={s.adminLink}>Privacy Policy</Link>
        <span style={s.dot}>·</span>
        <Link href="/terms" style={s.adminLink}>Terms of Service</Link>
      </footer>
    </main>
  );
}

const s = {
  page: { maxWidth: 520, margin: "0 auto", padding: "0 0 40px" },
  header: {
    display: "flex", alignItems: "center", justifyContent: "flex-end",
    padding: "8px 16px", fontFamily: "Inter, system-ui, sans-serif",
  },
  brand: { fontWeight: 800, fontSize: 22, color: "#0B1F18", letterSpacing: "-0.5px" },
  saved: {
    margin: "18px 16px 0", background: "#fff", border: "1px solid #E2E7E2",
    borderRadius: 16, padding: 16, fontFamily: "Inter, system-ui, sans-serif",
  },
  savedTitle: { fontSize: 13, textTransform: "uppercase", letterSpacing: "0.08em", color: "#5B6B62", margin: "0 0 12px" },
  row: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderTop: "1px solid #EEF2EE" },
  rowTitle: { fontWeight: 700, color: "#132A22", fontSize: 15 },
  rowMeta: { fontSize: 13, color: "#5B6B62", marginTop: 2 },
  del: { border: "1px solid #E2E7E2", background: "#fff", borderRadius: 8, padding: "6px 10px", fontSize: 13, fontWeight: 600, color: "#A21D22", cursor: "pointer" },
  footer: { textAlign: "center", padding: "24px 0", display: "flex", justifyContent: "center", alignItems: "center", gap: 8, flexWrap: "wrap" },
  adminLink: { fontSize: 12, color: "#5B6B62", textDecoration: "none" },
  dot: { fontSize: 12, color: "#B9C2BC" },
};
