# NaijaCGPA — email nudges setup

Sends two kinds of motivational emails on a schedule:
- **Onboarding** — signed up 2+ days ago but hasn't added any courses.
- **Re-engagement** — has results but hasn't updated them in 7+ days.

Nobody gets emailed more than once every 7 days, and opted-out users are skipped.

## Pieces

```
notifications.sql                    tables + candidate-selection function
supabase/functions/send-nudges/      the Edge Function that sends the emails
```

## 1. Database

Run `notifications.sql` in the Supabase SQL editor (after `schema.sql`).

Then enable two extensions in **Database → Extensions**: `pg_cron` and `pg_net`.

## 2. Resend (email provider)

1. Create a free account at resend.com.
2. Add and verify your sending domain (until then you can test with the built-in
   `onboarding@resend.dev` sender, but verify a domain before real sends).
3. Create an API key.

## 3. Install the Supabase CLI and link the project

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR-PROJECT-REF
```

## 4. Set the function secrets

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided automatically — do **not**
set them. Set the rest:

```bash
supabase secrets set \
  RESEND_API_KEY=re_xxxxxxxx \
  CRON_SECRET=$(openssl rand -hex 16) \
  NUDGE_FROM="NaijaCGPA <hi@yourdomain.com>" \
  APP_URL=https://your-app.vercel.app
```

Copy the `CRON_SECRET` value you generate — you need it in step 6.

## 5. Deploy the function

```bash
supabase functions deploy send-nudges
```

Test it manually (replace values):

```bash
curl -i -X POST https://YOUR-PROJECT.supabase.co/functions/v1/send-nudges \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

You should get `{"candidates":N,"sent":M,...}`. Without the correct secret it returns 401.

## 6. Schedule it (weekly, Monday 9am)

In the SQL editor:

```sql
select cron.schedule(
  'weekly-nudges',
  '0 9 * * 1',
  $$
  select net.http_post(
    url     := 'https://YOUR-PROJECT.supabase.co/functions/v1/send-nudges',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_CRON_SECRET',
      'Content-Type', 'application/json'
    )
  );
  $$
);
```

To change the time, edit the cron expression. To remove it:
`select cron.unschedule('weekly-nudges');`

## Notes & honest limits

- Start weekly, not daily — over-emailing is the fastest way to get marked as spam and
  lose students. You can tune the 2-day / 7-day windows in `get_nudge_candidates()`.
- Deliverability depends on verifying your domain in Resend (SPF/DKIM). The
  `resend.dev` test sender is fine for your own inbox, not for real users.
- Add a real unsubscribe link before scale — for now, students can be opted out by
  setting `opted_out = true` in `notification_state`. A one-click opt-out page is a
  good fast-follow.
- This does not send push notifications. Web push is a separate, heavier build; email
  reaches every device and is the right first channel.
