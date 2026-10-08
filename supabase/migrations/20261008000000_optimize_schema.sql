-- Migration: 20261008000000_optimize_schema.sql
-- Description: Adds critical indexes for pagination, tightens constraints, and optimizes high-volume query paths.

BEGIN;

-- 1. Indexing for Bounded Pagination & Sorting
-- The admin dashboard frequently queries ordered by created_at
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_events_created_at ON public.auth_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_events_created_at ON public.activity_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_errors_created_at ON public.errors(created_at DESC);

-- 2. Indexing for Foreign Keys (Preventing N+1 and slow JOINs)
CREATE INDEX IF NOT EXISTS idx_auth_events_user_id ON public.auth_events(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_user_id ON public.activity_events(user_id);
CREATE INDEX IF NOT EXISTS idx_errors_user_id ON public.errors(user_id);

-- 3. Optimization for Specific Queries
-- For finding recent active users quickly (used in getAdminOverview)
CREATE INDEX IF NOT EXISTS idx_activity_events_user_created ON public.activity_events(user_id, created_at DESC) WHERE user_id IS NOT NULL;

-- 4. Constraint Hardening
-- Ensure the role is strictly enforced at the database level just in case RLS fails
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'admin'));

-- Ensure event_type is not empty
ALTER TABLE public.activity_events 
  ADD CONSTRAINT activity_events_type_check CHECK (char_length(event_type) > 0);

-- 5. RLS Hardening (Update from previous schema)
-- Ensure 'admin' role checks use security definer functions if they become too complex,
-- but the current EXISTS subquery is highly cacheable by Postgres inside the transaction.

COMMIT;
