// Per-user localStorage draft store so a device shared by two students never
// shows one person's data to the other. Each user (and the signed-out "anon"
// session) gets its own namespaced key. Safe on the server (guards `window`).
const PREFIX = "naijacgpa:draft:v2:";

export function draftStore(scope) {
  const key = PREFIX + (scope || "anon");
  return {
    load() {
      if (typeof window === "undefined") return null;
      try {
        const raw = window.localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    },
    save(draft) {
      if (typeof window === "undefined") return;
      try {
        window.localStorage.setItem(key, JSON.stringify(draft));
      } catch {
        // storage full or blocked — ignore, app still works
      }
    },
    clear() {
      if (typeof window === "undefined") return;
      try {
        window.localStorage.removeItem(key);
      } catch {}
    },
  };
}

// One-time cleanup of the old shared (un-scoped) draft that leaked across users.
export function purgeLegacyDraft() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem("naijacgpa:draft:v1");
  } catch {}
}
