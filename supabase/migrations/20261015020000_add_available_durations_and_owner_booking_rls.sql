-- Migration: 20261015020000_add_available_durations_and_owner_booking_rls.sql
-- Description: Adds available_durations to public.rooms and enforces host self-booking prevention via RLS on public.bookings.

-- 1. Add available_durations array column to public.rooms (1, 2, and/or 3 hours)
ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS available_durations INTEGER[] NOT NULL DEFAULT '{1, 2, 3}';

COMMENT ON COLUMN public.rooms.available_durations IS 'Array of booking durations in hours (1, 2, and/or 3) offered by the host for this room.';

-- 2. Update RLS policy on public.bookings to strictly prevent hosts from booking their own rooms
DROP POLICY IF EXISTS "Travellers can create bookings" ON public.bookings;
CREATE POLICY "Travellers can create bookings" ON public.bookings
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = traveller_id 
    AND status = 'pending' 
    AND auth.uid() <> host_id
  );

-- 3. Reload PostgREST schema cache immediately
NOTIFY pgrst, 'reload schema';
