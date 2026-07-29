// localStorage-backed draft store so students can use the calculator offline
// and never lose their entries. Safe on the server (guards `window`).
const KEY = "naijacgpa:draft:v1";

export const localDraft = {
  load() {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  save(draft) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(draft));
    } catch {
      // storage full or blocked (private mode) — ignore, app still works.
    }
  },
  clear() {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(KEY);
    } catch {}
  },
};
