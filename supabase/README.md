# Deploying the DOCS database

## Before and after every deploy that touches policies

Run `scripts/audit-open-policies.sql` against the production project, once before
the deploy and once after.

```
psql "$DOCS_DATABASE_URL" -f scripts/audit-open-policies.sql
```

or paste it into the SQL editor on the DOCS project. It is read only.

Three results come back.

1. **Policies still open to every login.** Must be empty after the deploy. A row
   here is a table that any signed-in session can read and write, whatever the
   console shows them. The role migrations sweep these away from an explicit
   table list, so a table created in the dashboard and never named in a
   migration keeps its old `USING (true)` policy and does not appear in any
   review of the code. This query is the only thing that finds it.
2. **Tables with RLS on and no policy at all.** Check this one before the
   deploy. Nobody can read those tables. Failing closed is the right direction
   and it is still an outage, so it should be a decision rather than a surprise.
3. **Every table with its policy list.** Context. Diff the before and after
   captures to see exactly what the deploy changed.

## Before running 20260817090000_admin_roles_and_permissions.sql

That migration backfills every existing `auth.users` row into `admin_users` as
`owner`. Count the auth users first:

```sql
SELECT id, email, created_at, last_sign_in_at FROM auth.users ORDER BY created_at;
```

One row is expected. If there is a second, a stale invite or a test account
created during development, it is handed owner by the backfill. Delete it or
demote it in the same session. The header of the migration says the same thing.
