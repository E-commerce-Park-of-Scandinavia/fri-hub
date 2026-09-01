<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# FRI Hub

Read `README.md` for the shape of the project and `SETUP.md` for the accounts and
Supabase configuration it depends on.

Two rules specific to this codebase:

- **Security lives in `supabase/migrations/0002_rls.sql`**, not in the pages. If a
  change affects who can see what, change the policy and say so — do not add a
  filter in a component and call it done.
- **Do not add file storage, Slack syncing, or Drive API integration.** They are
  explicit non-goals; Drive and Slack stay the source of truth and the hub links
  out to them.
