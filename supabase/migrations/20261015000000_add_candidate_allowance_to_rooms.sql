-- Migration: 20261015000000_add_candidate_allowance_to_rooms.sql
-- Description: Adds candidate_allowance column to public.rooms if missing, ensures positive integer constraint, and reloads PostgREST schema cache.

-- 1. Add column with positive integer default if not present
ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS candidate_allowance INTEGER NOT NULL DEFAULT 1;

-- 2. Ensure positive value check constraint exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'rooms_candidate_allowance_check'
  ) THEN
    ALTER TABLE public.rooms
      ADD CONSTRAINT rooms_candidate_allowance_check CHECK (candidate_allowance > 0);
  END IF;
END $$;

-- 3. Document column purpose
COMMENT ON COLUMN public.rooms.candidate_allowance IS 'Maximum number of exam candidates/travellers allowed to stay in the room simultaneously.';

-- 4. Reload PostgREST schema cache so Supabase immediately recognizes the new column
NOTIFY pgrst, 'reload schema';
