# NaijaCGPA

School-aware CGPA calculator for Nigerian students, with a shareable WhatsApp result
card, Google login, saved results, and an admin dashboard. Next.js (App Router) + Supabase.

## Quickstart (local)

```bash
# 1. install
npm install

# 2. set up env
cp .env.local.example .env.local
#    then paste your Supabase URL + anon key into .env.local

# 3. run
npm run dev
```

Open http://localhost:3000

> Login and saving won't work until you finish the Supabase + Google steps in
> **SETUP.md** (create the project, run `schema.sql` and `admin.sql`, enable Google).
> The calculator itself works immediately without any of that.

## What's inside

```
app/
  layout.jsx              root layout
  page.jsx                home — calculator + login + your saved results
  auth/callback/route.js  Google OAuth callback
  admin/page.jsx          registration dashboard (/admin)
components/
  CgpaCalculator.jsx      the calculator
  AuthButton.jsx          Google sign in / out
lib/
  results.js              save / list / delete results
  supabase/               browser + server clients, session middleware
middleware.js             refreshes the auth session on each request
schema.sql                run once in Supabase (results table + RLS)
admin.sql                 run once in Supabase (admin allowlist + stats function)
```

## Full guides

- **SETUP.md** — Supabase project, database, and Google login, step by step.
- **DEPLOY.md** — deploy to Vercel or Netlify, and the auth-URL step that people miss.

## Order to do things

1. `npm install` and run locally — confirm the calculator loads.
2. Follow SETUP.md: create Supabase project, run `schema.sql` + `admin.sql`
   (add your email to `public.admins`), enable Google.
3. Add your Supabase values to `.env.local`, restart `npm run dev`.
4. Test: sign in, save a result, open `/admin`.
5. Follow DEPLOY.md to go live on Vercel or Netlify.
