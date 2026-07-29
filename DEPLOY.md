# NaijaCGPA — deploy to Vercel or Netlify

## Project structure

Place the files like this in your Next.js project (App Router):

```
your-app/
├─ middleware.js                     ← from naija-auth/
├─ app/
│  ├─ layout.jsx
│  ├─ page.jsx                       ← home: calculator + login + saved results
│  ├─ auth/callback/route.js
│  └─ admin/page.jsx                 ← dashboard
├─ components/
│  ├─ CgpaCalculator.jsx             ← the calculator file
│  └─ AuthButton.jsx
├─ lib/
│  ├─ results.js
│  └─ supabase/
│     ├─ client.js
│     ├─ server.js
│     └─ middleware.js
├─ .env.local                        ← NOT committed
└─ package.json
```

`schema.sql` and `admin.sql` are not shipped — you run them once in the Supabase SQL editor.

## Before deploying

1. Get it running locally first: `npm run dev`, sign in with Google, save a result,
   open `/admin` (after adding your email via `admin.sql`). If local works, deploy will too.
2. Push the project to a GitHub repo (both Vercel and Netlify deploy from Git).
3. Make sure `.env.local` is in `.gitignore` (create-next-app does this by default) —
   you'll set those values in the host's dashboard instead, never in the repo.

## The two env vars you need on the host

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```

Both are safe to expose (RLS protects the data). Do **not** add the service-role key.

---

## Option A — Vercel (easiest for Next.js)

1. Go to vercel.com → **Add New → Project** → import your GitHub repo.
2. Framework preset auto-detects **Next.js**. Leave build settings default.
3. Open **Environment Variables**, add the two vars above, then **Deploy**.
4. You'll get a URL like `https://your-app.vercel.app`.

## Option B — Netlify

1. Go to netlify.com → **Add new site → Import an existing project** → pick the repo.
2. Netlify detects Next.js and uses its Next runtime automatically (no config needed;
   if prompted, build command `next build`, and the `@netlify/plugin-nextjs` plugin
   handles the rest).
3. **Site settings → Environment variables**, add the two vars above.
4. Deploy. You'll get a URL like `https://your-app.netlify.app`.

---

## CRITICAL: point auth at your live URL (or login breaks)

OAuth only works for URLs you've whitelisted. After your first deploy, update three places
with your real domain (`https://your-app.vercel.app` or your custom domain):

**1. Supabase → Authentication → URL Configuration**
- Site URL: `https://your-app.vercel.app`
- Additional Redirect URLs: add `https://your-app.vercel.app/**`

**2. Google Cloud Console → Credentials → your OAuth client**
- Authorized JavaScript origins: add `https://your-app.vercel.app`
- Authorized redirect URIs: leave the Supabase callback
  (`https://YOUR-PROJECT.supabase.co/auth/v1/callback`) — it does not change.

**3. Redeploy** if your host cached the old env — usually not needed, but if login
   misbehaves, trigger a fresh deploy.

If sign-in returns you to the site logged out, it's almost always a missing entry in
step 1 or 2 — that's the first thing to check.

## Custom domain

Add your domain in the host dashboard (Vercel: Project → Domains; Netlify: Domain
management), then repeat the CRITICAL section with the custom domain so it's whitelisted too.

## Post-deploy checklist

- [ ] `schema.sql` and `admin.sql` run in Supabase
- [ ] Your email inserted into `public.admins`
- [ ] Google provider enabled in Supabase with Client ID + secret
- [ ] Both env vars set on the host
- [ ] Live domain added to Supabase Site URL + redirect URLs
- [ ] Live domain added to Google authorized origins
- [ ] Test: sign in, save a result, load `/admin`
