"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { saveState, loadState } from "@/lib/results";
import { localDraft } from "@/lib/localDraft";
import AuthButton from "@/components/AuthButton";
import CgpaCalculator from "@/components/CgpaCalculator";

export default function CalculatorPage() {
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [initialState, setInitialState] = useState(null);
  const [hasRecord, setHasRecord] = useState(false);
  const [syncedAt, setSyncedAt] = useState(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();

    const load = async (u) => {
      setUser(u);
      if (!u) {
        setInitialState(null);
        setHasRecord(false);
        setSyncedAt(null);
        return;
      }
      try {
        const st = await loadState();
        if (st) {
          setInitialState(st.draft);
          setHasRecord(true);
          setSyncedAt(st.updatedAt);
        }
      } catch {}
    };

    supabase.auth.getUser().then(({ data }) => load(data.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      load(session?.user ?? null)
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSave = async (snapshot) => {
    if (!isSupabaseConfigured) {
      alert("Connect Supabase (see SETUP.md) to enable saving.");
      return;
    }
    setSaving(true);
    try {
      const saved = await saveState(snapshot);
      setHasRecord(true);
      setSyncedAt(saved?.updated_at ?? new Date().toISOString());
    } catch (e) {
      if (/sign in/i.test(e.message)) {
        await createClient().auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: `${window.location.origin}/auth/callback?next=/calculator` },
        });
      } else {
        alert(e.message);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <main style={s.page}>
      <header style={s.header}>
        <Link href="/" style={s.home}>← Home</Link>
        <AuthButton />
      </header>

      <CgpaCalculator
        onSave={handleSave}
        saving={saving}
        storage={localDraft}
        initialState={initialState}
        saveLabel={hasRecord ? "Update my account" : "Save to my account"}
      />

      {user && syncedAt && (
        <p style={s.synced}>
          ✓ Synced to your account · updated {new Date(syncedAt).toLocaleString()}
        </p>
      )}

      <footer style={s.footer}>
        <Link href="/privacy" style={s.link}>Privacy Policy</Link>
        <span style={s.dot}>·</span>
        <Link href="/terms" style={s.link}>Terms of Service</Link>
      </footer>
    </main>
  );
}

const s = {
  page: { maxWidth: 520, margin: "0 auto", padding: "0 0 40px", fontFamily: "'Poppins', system-ui, sans-serif" },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "8px 16px",
  },
  home: { fontSize: 14, color: "#5B6B62", textDecoration: "none", fontWeight: 600 },
  synced: { textAlign: "center", fontSize: 12.5, color: "#0A6B45", margin: "14px 16px 0", fontWeight: 600 },
  footer: { textAlign: "center", padding: "24px 0", display: "flex", justifyContent: "center", alignItems: "center", gap: 8, flexWrap: "wrap" },
  link: { fontSize: 12, color: "#5B6B62", textDecoration: "none" },
  dot: { fontSize: 12, color: "#B9C2BC" },
};
