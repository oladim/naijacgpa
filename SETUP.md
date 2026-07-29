# NaijaCGPA — Google login + saved results

Drop-in auth layer for your Next.js App Router project. About 20 minutes end to end.

## File placement

Copy these into your project, keeping the paths:

```
middleware.js                      ← project root (next to package.json)
schema.sql                         ← run once in Supabase, don't ship it
lib/supabase/client.js
lib/supabase/server.js
lib/supabase/middleware.js
lib/results.js
app/auth/callback/route.js
components/AuthButton.jsx
```

The imports use the `@/` alias, which `create-next-app` sets up by default. If yours
doesn't, add to `jsconfig.json`: `{ "compilerOptions": { "paths": { "@/*": ["./*"] } } }`.

## 1. Install packages

```bash
npm install @supabase/supabase-js @supabase/ssr
```

## 2. Create the Supabase project

1. Go to supabase.com, create a project (free tier is fine — 50,000 monthly users).
2. Project Settings → API. Copy the **Project URL** and the **anon public** key.

## 3. Add environment variables

Create `.env.local` in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```

## 4. Create the table

Supabase dashboard → SQL Editor → New query → paste all of `schema.sql` → Run.
This creates the `results` table and the row-level-security policies that keep each
student's data private.

## 5. Set up Google OAuth

**In Google Cloud Console** (console.cloud.google.com):
1. APIs & Services → Credentials → Create Credentials → OAuth client ID.
2. Application type: **Web application**.
3. Authorized JavaScript origins: `http://localhost:3000` (add your real domain later).
4. Authorized redirect URIs: your Supabase callback —
   `https://YOUR-PROJECT.supabase.co/auth/v1/callback`.
5. Copy the **Client ID** and **Client secret**.

**In Supabase dashboard:**
1. Authentication → Providers → Google → enable, paste the Client ID and secret, save.
2. Authentication → URL Configuration:
   - Site URL: `http://localhost:3000` (switch to your domain in production).
   - Additional Redirect URLs: add `http://localhost:3000/**` and your production
     `https://yourdomain.com/**`.

## 6. Add the login button

In your page or a header component:

```jsx
import AuthButton from "@/components/AuthButton";

export default function Page() {
  return (
    <header>
      <AuthButton />
    </header>
  );
}
```

Run `npm run dev`, click **Continue with Google** — you should land back signed in.

## 7. Wire "Save my result" into the calculator

The calculator already holds everything you need in state: `level`, `scale`, `name`,
`courses`, `priorSemesters`, `shownCgpa`, `cls`, and `shownUnits`. Add this near the
share buttons inside `CgpaCalculator`:

```jsx
"use client";
import { saveResult } from "@/lib/results";

// ...inside the component:
const [saving, setSaving] = useState(false);

const handleSave = async () => {
  setSaving(true);
  try {
    await saveResult({
      title: name || "My result",
      level,
      scale,
      cgpa: isFinite(shownCgpa) ? Number(shownCgpa.toFixed(2)) : null,
      className: cls.short,
      unitsCounted: shownUnits,
      // full snapshot so you can reload it later
      payload: { level, scale, inputMode, name, courses, priorSemesters, expungeFailedCarryovers },
    });
    alert("Saved to your account.");
  } catch (e) {
    alert(e.message); // "Please sign in to save your result." when logged out
  } finally {
    setSaving(false);
  }
};

// button:
<button className="ncg-btn ncg-btn-img" onClick={handleSave} disabled={saving}>
  {saving ? "Saving…" : "Save my result"}
</button>
```

To show a student's history, call `listResults()` and restore a row by loading its
`payload` back into the calculator's state setters. `deleteResult(id)` removes one.

## 8. Ship

Deploy to Vercel, add the same two env vars in the Vercel project settings, and update
the Google origins/redirects and the Supabase Site URL to your production domain.

---

### Notes
- The anon key is meant to be public; RLS is what protects the data. Never expose the
  **service role** key in the browser.
- Sign-in state is available in Server Components too via `createClient()` from
  `lib/supabase/server.js` and `await supabase.auth.getUser()`.
- When you add per-school later, add a `school_id` column to `results` and a `schools`
  table; the auth layer here doesn't change.
