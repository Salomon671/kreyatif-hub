-- Kreyatif Hub: read-only RLS audit
-- Run this in Supabase SQL Editor. It does not change data or policies.
-- Review the results before adding or replacing policies.

-- 1) Confirm RLS is enabled for the marketplace tables.
select n.nspname as schema_name,
       c.relname as table_name,
       c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('profiles','admin_users','shops','listings','reports')
order by c.relname;

-- 2) Inspect existing policies, including their roles and expressions.
select schemaname, tablename, policyname, permissive, roles,
       cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('profiles','admin_users','shops','listings','reports')
order by tablename, policyname;

-- 3) Check table grants to browser roles.
select table_schema, table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon','authenticated')
  and table_name in ('profiles','admin_users','shops','listings','reports')
order by table_name, grantee, privilege_type;

-- SECURITY REVIEW CHECKLIST (manual)
-- * listings: anonymous SELECT must return published rows only; authenticated
--   users may additionally read their own pending/draft rows.
-- * shops: anonymous SELECT must return published shops only; owners can read
--   their own pending shops.
-- * INSERT policies must use WITH CHECK (auth.uid() = owner/user column).
-- * UPDATE policies must have both a restrictive USING and WITH CHECK owner
--   condition. Do not allow owners to edit approval/status or ownership columns.
-- * admin_users must not be readable/writable by anon or ordinary users.
--   Do not trust user-editable profile metadata as proof of admin status.
-- * reports: users may create reports and read only their own reports; admin
--   moderation must be enforced by a trusted database-side admin check.
-- * Storage upload policies must restrict the first folder segment to auth.uid().
-- * Test each policy with an anonymous session, a normal account, another
--   account, and the actual admin account before launch.
--
-- Existing schema and column names may vary. Do not paste generic policy
-- definitions without matching them to the actual table definitions.
