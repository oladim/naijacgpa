"use client";

import { useEffect, useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function AuthButton() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = () =>
    createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });

  const signOut = () => createClient().auth.signOut();

  if (!isSupabaseConfigured || loading) return null;

  if (user) {
    const label = user.user_metadata?.full_name || user.email;
    return (
      <div style={styles.wrap}>
        <span style={styles.hi}>{label}</span>
        <button style={styles.ghost} onClick={signOut}>
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button style={styles.google} onClick={signIn}>
      <GoogleMark />
      Continue with Google
    </button>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5h-1.9V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-8l-6.6 5.1C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.5l6.3 5.3C41.9 36.4 44 30.8 44 24c0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  );
}

const styles = {
  wrap: { display: "flex", alignItems: "center", gap: 10 },
  hi: { fontSize: 13, color: "#5B6B62", fontWeight: 600 },
  ghost: {
    border: "1px solid #E2E7E2", background: "#fff", borderRadius: 10,
    padding: "8px 12px", font: "inherit", fontSize: 13, fontWeight: 700,
    color: "#132A22", cursor: "pointer",
  },
  google: {
    display: "inline-flex", alignItems: "center", gap: 10,
    border: "1px solid #E2E7E2", background: "#fff", borderRadius: 12,
    padding: "11px 16px", font: "inherit", fontSize: 15, fontWeight: 700,
    color: "#132A22", cursor: "pointer",
  },
};
