# FRI Hub

Participant portal for the **Future Retail Incubator**, run by E-commerce Park of
Scandinavia in Helsingborg.

Its job is to answer three questions and nothing else: *what's next, who's in my
group, and where's the material.* The community stays in Slack and the files stay
in Google Drive — this hub links out to both rather than replacing them.

**New here? Read [SETUP.md](SETUP.md).** It covers the accounts, the database, and
the email configuration that will otherwise silently swallow your invites.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Database + Auth | Supabase — Postgres, magic-link auth, Row Level Security |
| Hosting | Vercel |
| Files | None. Google Drive links only. |
| Styling | Tailwind CSS 4 |

Runs at €0/month at this scale. See SETUP.md §8.

## How it is put together

```
app/(hub)/      participant pages — home, schedule, directory,
                knowledge hub, focus circle, community, profile
app/admin/      admin pages — participants, sessions, knowledge hub,
                cohorts, programmes, check-ins
app/auth/       magic-link callback and sign-out
lib/data.ts     every read query, in one place
lib/supabase/   server / browser / service-role clients
supabase/       migrations and seed data
proxy.ts        refreshes the session, sends signed-out visitors to /login
```

### Three things worth knowing before changing anything

**Access control lives in the database, not in the pages.**
`supabase/migrations/0002_rls.sql` is the real security boundary. The pages just
ask for rows; Postgres decides which ones come back. A page that forgets to filter
by cohort still cannot leak another cohort's data. Test changes there, not in the UI.

**A joint session is two rows, not a special case.**
`session_cohorts` links a session to each attending cohort. Autumn 2026 and Spring
2026 sitting in the same room on a Tuesday is two rows. Nothing else in the codebase
knows that joint sessions exist — and neither cohort can see the other's directory.

**The schema is multi-programme from day one.**
FRI is the only seeded `programs` row. Kompetenslyftet can be added through
`/admin/programmes` without touching the schema.

## Local development

```bash
npm install
```

```bash
cp .env.example .env.local
```

Fill in `.env.local` from your Supabase project, then:

```bash
npm run dev
```

## Deliberately not built (v1)

Google Drive folder listing via API · pulling Slack messages into the app · a
public alumni showcase · payments · a native app · automated email digests · a
drag-and-drop questionnaire builder.
