# FRI Hub — setup

Everything here is a one-time job. Once it is done, running the hub is just
adding people and sessions in `/admin`.

Steps 1–3 must be done by a person, not by Claude Code: they involve creating
accounts and entering passwords.

---

## 1. Accounts (do this first)

The point of this step is that **no account is tied to Sylvia's personal login**.
Each service gets an organisation/team owned by `info@ecommercepark.se`, with
named colleagues invited as members.

### GitHub — an Organization, not a personal repo

1. Sign in to GitHub (or create an account using `info@ecommercepark.se`).
2. Go to **Settings → Organizations → New organization** and pick the **Free** plan.
3. Organization name: `ecommerce-park-scandinavia` (or similar).
   Contact email: `info@ecommercepark.se`.
4. Inside the org: **New repository** → name `fri-hub` → **Private**.
5. **People → Invite member** for each colleague who should be able to maintain
   this. Give at least one other person the **Owner** role, so the account is not
   a single point of failure.

Then push this project to it:

```bash
git remote add origin https://github.com/YOUR-ORG/fri-hub.git
```

```bash
git push -u origin main
```

### Vercel — a Team, not a personal account

1. Go to vercel.com and **Sign up with GitHub**, using the account that owns the org.
2. Create a **Team** (Hobby plan is free). Name it after the organisation.
3. **Settings → General → Team Email**: `info@ecommercepark.se`.
4. **Settings → Members**: invite the same colleagues.
5. **Add New → Project** → import the `fri-hub` repo from the GitHub org.
   Do **not** deploy yet — it needs the environment variables from step 2.

### Supabase — an Organization

1. Go to supabase.com and sign up.
2. Create an **Organization** (Free plan), billing email `info@ecommercepark.se`.
3. **New project** inside it: name `fri-hub`, region **Frankfurt (eu-central-1)** —
   closest to Helsingborg, and keeps participant data inside the EU.
4. Save the database password somewhere safe (a password manager, not a document).
5. **Organization Settings → Team → Invite** the same colleagues.

---

## 2. Environment variables

In Supabase: **Project Settings → API**. Copy:

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

Locally, copy `.env.example` to `.env.local` and fill those in. `.env.local` is
git-ignored and must never be committed.

In Vercel, add all four variables under **Settings → Environment Variables**:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | from Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from Supabase |
| `NEXT_PUBLIC_SITE_URL` | your real domain, e.g. `https://hub.ecommercepark.se` — no trailing slash |
| `SUPABASE_SERVICE_ROLE_KEY` | from Supabase — **never** rename this with a `NEXT_PUBLIC_` prefix |

The service_role key bypasses all security rules. It is used in exactly one place
(`lib/supabase/admin.ts`, for sending invite emails) and never reaches the browser.

---

## 3. Create the database

In Supabase: **SQL Editor → New query**. Run these three files in order, pasting
the contents of each and clicking **Run**:

1. `supabase/migrations/0001_schema.sql` — tables
2. `supabase/migrations/0002_rls.sql` — the access rules
3. `supabase/seed.sql` — the programme, both cohorts, and the Sept–Dec 2026 sessions

Optionally, `supabase/seed_demo_participants.sql` adds six fake participants so
the directory has something in it while you are testing. Delete them before launch:

```sql
delete from participants where email like '%@example.test';
```

### Then fix the placeholders

The seed contains deliberate `REPLACE-ME` values. Set them in `/admin` once you
can log in, or directly in the SQL editor:

- **Sylvia's admin email** — the seed uses `sylvia@ecommercepark.se`. If that is
  not the real address, change it before doing anything else, or nobody can reach
  `/admin`:
  ```sql
  update participants set email = 'your.real@ecommercepark.se' where role = 'admin';
  ```
- **Slack links** — the workspace invite URL on the programme, and the channel URL
  on each cohort (`/admin/programmes` and `/admin/cohorts`).
- **Cohort dates** — Spring 2026's start date and Autumn 2026's expected end date
  are assumptions. See the comment at the top of `seed.sql`.

---

## 4. Auth settings

In Supabase: **Authentication → URL Configuration**

- **Site URL**: your production domain.
- **Redirect URLs**: add both
  - `http://localhost:3000/**`
  - `https://your-domain/**`

In **Authentication → Providers → Email**: turn **Confirm email** on, and leave
**Enable email signups** as is — the app passes `shouldCreateUser: false`, so an
address that has not been invited cannot create an account regardless.

### ⚠️ Email sending — the one thing that will bite you

Supabase's built-in email service is **rate-limited to a handful of messages per
hour** and is meant for testing only. With 20–40 participants per cohort you will
hit that limit on your first invite run, and people will silently not receive
their magic links.

Fix it before launch, under **Project Settings → Authentication → SMTP Settings**:

- **Resend** — free tier covers 3,000 emails/month, far more than this needs. Or
- **Your existing Google Workspace / Microsoft 365 SMTP** for `ecommercepark.se`,
  which costs nothing extra since you already pay for the mailbox.

Set the sender to `info@ecommercepark.se` so invites come from the organisation
rather than from a person.

---

## 5. Run it locally

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:3000. You will land on `/login`. Enter the admin email from
the seed, then click the link in the email.

---

## 6. Deploy

Push to `main`; Vercel builds and deploys automatically. Add the custom domain
under **Settings → Domains**, then update `NEXT_PUBLIC_SITE_URL` and the Supabase
redirect URLs to match.

---

## 7. Day-to-day: how the pieces work

**Inviting someone.** `/admin/participants` → add them (name, email, cohort) →
expand their row → **Send invite email**. Creating the row is what makes their
address eligible to log in; there is no public sign-up. Once they click the link,
the database attaches their login to the row automatically.

**Making someone an alumni.** Expand their row, set Status to Alumni. They keep
permanent read access to their own cohort's schedule, directory and knowledge hub;
they simply have nothing left to check into.

**Adding slides.** In Google Slides: **File → Share → Publish to web → Embed**.
Copy the URL out of the `src="..."` attribute and paste it into the session's
Slides URL field. It then renders inside the session page. Only `docs.google.com`
URLs are embedded — anything else is shown as a plain link, on purpose.

**A session both cohorts attend.** Tick both cohorts on the session. That is the
whole mechanism: each cohort sees the day on their own schedule, and neither can
see the other's directory.

**Knowledge Hub items.** Leave "Visible to" on *All cohorts* unless it is genuinely
cohort-specific. Title convention: `DDMMMYYYY - Topic`, e.g. `22SEP2026 - Fotbutiken visit notes`.

---

## 8. What this costs

Nothing, at this scale:

- **Vercel Hobby** — free. (Note: Vercel's Hobby plan is for non-commercial use.
  A team account for a funded programme may need the Pro plan at $20/user/month;
  worth checking with Vercel if that matters to you.)
- **Supabase Free** — 500 MB database, 50,000 monthly active users. Two cohorts of
  40 is nowhere near it. Free projects pause after a week with no activity and
  resume on the next request.
- **Resend Free** — 3,000 emails/month, if you use it for SMTP.

Nothing in the app requires a paid tier.

---

## 9. Still to confirm

- **Spring 2026 start date** and **Autumn 2026 end date** — assumed in the seed.
- **UI language** — English only, as scoped. Swedish would mean translating roughly
  60 strings across the pages; no framework for it is in place yet.
- **One cohort per participant** — assumed throughout, including in the security
  rules. If someone can ever belong to two cohorts at once, that is a schema change,
  not a settings change.
