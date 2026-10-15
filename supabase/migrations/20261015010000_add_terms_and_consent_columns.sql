-- Migration: 20261015010000_add_terms_and_consent_columns.sql
-- Description: Adds terms agreements, consent timestamps, terms versions, and compliance flags to public.rooms and public.bookings.

-- 1. Add host consent columns to public.rooms
ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS terms_agreed BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS terms_agreed_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS terms_version TEXT DEFAULT '2026-10-v1';

COMMENT ON COLUMN public.rooms.terms_agreed IS 'Whether host confirmed authorization, accuracy, legal compliance, and non-discrimination.';
COMMENT ON COLUMN public.rooms.terms_agreed_at IS 'Timestamp when the host agreed to listing terms.';
COMMENT ON COLUMN public.rooms.terms_version IS 'Version of host terms agreed to.';

-- 2. Add traveller consent columns to public.bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS terms_agreed BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS terms_agreed_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS terms_version TEXT DEFAULT '2026-10-v1',
  ADD COLUMN IF NOT EXISTS rules_agreed BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS id_verification_agreed BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.bookings.terms_agreed IS 'Whether traveller agreed to conduct standards, allowance limits, and safety terms.';
COMMENT ON COLUMN public.bookings.rules_agreed IS 'Whether traveller confirmed reading and agreeing to host house rules.';
COMMENT ON COLUMN public.bookings.id_verification_agreed IS 'Whether traveller agreed to provide in-person physical government ID verification to host.';
COMMENT ON COLUMN public.bookings.terms_agreed_at IS 'Timestamp when traveller submitted consent.';
COMMENT ON COLUMN public.bookings.terms_version IS 'Version of guest terms agreed to.';

-- 3. Reload PostgREST schema cache immediately
NOTIFY pgrst, 'reload schema';
