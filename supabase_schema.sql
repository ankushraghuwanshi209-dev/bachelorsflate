-- ====================================================================
-- Bachelors Flat: Complete Supabase PostgreSQL Schema & Security Rules
-- Run this in Supabase Dashboard -> SQL Editor -> New Query
-- ====================================================================

-- 1. Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create users profile table (Private profile)
CREATE TABLE IF NOT EXISTS public.users (
  uid UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  phone_number TEXT,
  roles TEXT[] NOT NULL DEFAULT ARRAY['traveller']::TEXT[],
  photo_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  bio TEXT,
  city TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create public profiles table (Exposed publicly for listings & reviews)
CREATE TABLE IF NOT EXISTS public.public_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  photo_url TEXT,
  city TEXT,
  bio TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create rooms table (Public listing details)
CREATE TABLE IF NOT EXISTS public.rooms (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  host_name TEXT NOT NULL,
  host_photo TEXT,
  host_rating NUMERIC(3, 2) DEFAULT 5.0,
  review_count INTEGER DEFAULT 0,
  title TEXT NOT NULL,
  description TEXT,
  city TEXT NOT NULL,
  neighbourhood TEXT NOT NULL,
  approx_location TEXT NOT NULL,
  amenities TEXT[] DEFAULT ARRAY[]::TEXT[],
  bathroom_type TEXT DEFAULT 'attached',
  nearby_landmark TEXT,
  house_rules TEXT[] DEFAULT ARRAY[]::TEXT[],
  pricing JSONB NOT NULL DEFAULT '{"hourly": 100, "twoToThreeHours": 350}'::JSONB,
  min_stay_hours INTEGER DEFAULT 2,
  max_stay_hours INTEGER DEFAULT 24,
  available_times TEXT DEFAULT '07:00 AM - 10:00 PM',
  photos TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'paused')),
  is_demo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create room_private table (Host only: Exact address & check-in details)
CREATE TABLE IF NOT EXISTS public.room_private (
  room_id TEXT PRIMARY KEY REFERENCES public.rooms(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exact_address TEXT NOT NULL,
  check_in_instructions TEXT,
  host_phone TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  room_id TEXT NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  room_title TEXT NOT NULL,
  room_photo TEXT,
  city TEXT NOT NULL,
  neighbourhood TEXT NOT NULL,
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  host_name TEXT NOT NULL,
  traveller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  traveller_name TEXT NOT NULL,
  traveller_email TEXT NOT NULL,
  traveller_phone TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TEXT NOT NULL,
  duration TEXT NOT NULL,
  duration_hours INTEGER NOT NULL,
  guest_count INTEGER NOT NULL DEFAULT 1,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled', 'completed')),
  total_price NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create booking_private_details table (Unlocked only upon booking acceptance)
CREATE TABLE IF NOT EXISTS public.booking_private_details (
  booking_id TEXT PRIMARY KEY REFERENCES public.bookings(id) ON DELETE CASCADE,
  exact_address TEXT NOT NULL,
  check_in_instructions TEXT,
  host_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  booking_id TEXT NOT NULL,
  room_id TEXT NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  traveller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  traveller_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  moderation_status TEXT NOT NULL DEFAULT 'approved' CHECK (moderation_status IN ('approved', 'pending', 'flagged')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- AUTOMATIC AUTH USER TRIGGER (Creates users & public_profiles on signup)
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (uid, email, display_name, phone_number, roles, created_at)
  VALUES (
    new.id,
    COALESCE(new.email, ''),
    COALESCE(new.raw_user_meta_data->>'display_name', 'Aspirant Traveller'),
    COALESCE(new.raw_user_meta_data->>'phone_number', ''),
    CASE 
      WHEN new.raw_user_meta_data->'roles' IS NOT NULL 
      THEN ARRAY(SELECT jsonb_array_elements_text(new.raw_user_meta_data->'roles'))
      ELSE ARRAY['traveller']::TEXT[]
    END,
    NOW()
  )
  ON CONFLICT (uid) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(EXCLUDED.display_name, public.users.display_name);

  INSERT INTO public.public_profiles (id, display_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'display_name', 'Aspirant Traveller')
  )
  ON CONFLICT (id) DO UPDATE SET
    display_name = COALESCE(EXCLUDED.display_name, public.public_profiles.display_name);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_private ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_private_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- users policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
CREATE POLICY "Users can read own profile" ON public.users
  FOR SELECT TO authenticated USING (auth.uid() = uid);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = uid);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE TO authenticated USING (auth.uid() = uid);

-- public_profiles policies
DROP POLICY IF EXISTS "Anyone can read public profiles" ON public.public_profiles;
CREATE POLICY "Anyone can read public profiles" ON public.public_profiles
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Users can insert own public profile" ON public.public_profiles;
CREATE POLICY "Users can insert own public profile" ON public.public_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own public profile" ON public.public_profiles;
CREATE POLICY "Users can update own public profile" ON public.public_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- rooms policies
DROP POLICY IF EXISTS "Active rooms are publicly readable" ON public.rooms;
CREATE POLICY "Active rooms are publicly readable" ON public.rooms
  FOR SELECT TO public USING (status = 'active' OR (auth.uid() IS NOT NULL AND auth.uid() = host_id));

DROP POLICY IF EXISTS "Authenticated hosts can create rooms" ON public.rooms;
CREATE POLICY "Authenticated hosts can create rooms" ON public.rooms
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = host_id);

DROP POLICY IF EXISTS "Hosts can update their own rooms" ON public.rooms;
CREATE POLICY "Hosts can update their own rooms" ON public.rooms
  FOR UPDATE TO authenticated USING (auth.uid() = host_id);

DROP POLICY IF EXISTS "Hosts can delete their own rooms" ON public.rooms;
CREATE POLICY "Hosts can delete their own rooms" ON public.rooms
  FOR DELETE TO authenticated USING (auth.uid() = host_id);

-- room_private policies
DROP POLICY IF EXISTS "Hosts can read own room private details" ON public.room_private;
CREATE POLICY "Hosts can read own room private details" ON public.room_private
  FOR SELECT TO authenticated USING (auth.uid() = host_id);

DROP POLICY IF EXISTS "Hosts can insert own room private details" ON public.room_private;
CREATE POLICY "Hosts can insert own room private details" ON public.room_private
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = host_id);

DROP POLICY IF EXISTS "Hosts can update own room private details" ON public.room_private;
CREATE POLICY "Hosts can update own room private details" ON public.room_private
  FOR UPDATE TO authenticated USING (auth.uid() = host_id);

DROP POLICY IF EXISTS "Hosts can delete own room private details" ON public.room_private;
CREATE POLICY "Hosts can delete own room private details" ON public.room_private
  FOR DELETE TO authenticated USING (auth.uid() = host_id);

-- bookings policies
DROP POLICY IF EXISTS "Hosts and travellers can read their bookings" ON public.bookings;
CREATE POLICY "Hosts and travellers can read their bookings" ON public.bookings
  FOR SELECT TO authenticated USING (auth.uid() = host_id OR auth.uid() = traveller_id);

DROP POLICY IF EXISTS "Travellers can create bookings" ON public.bookings;
CREATE POLICY "Travellers can create bookings" ON public.bookings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = traveller_id AND status = 'pending');

DROP POLICY IF EXISTS "Parties can update their bookings" ON public.bookings;
CREATE POLICY "Parties can update their bookings" ON public.bookings
  FOR UPDATE TO authenticated USING (auth.uid() = host_id OR auth.uid() = traveller_id);

DROP POLICY IF EXISTS "Parties can delete their bookings" ON public.bookings;
CREATE POLICY "Parties can delete their bookings" ON public.bookings
  FOR DELETE TO authenticated USING (auth.uid() = host_id OR auth.uid() = traveller_id);

-- booking_private_details policies
DROP POLICY IF EXISTS "Accepted booking parties can read private details" ON public.booking_private_details;
CREATE POLICY "Accepted booking parties can read private details" ON public.booking_private_details
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id
        AND b.status IN ('accepted', 'completed')
        AND (b.host_id = auth.uid() OR b.traveller_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Host can insert booking private details on accept" ON public.booking_private_details;
CREATE POLICY "Host can insert booking private details on accept" ON public.booking_private_details
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id AND b.host_id = auth.uid()
    )
  );

-- reviews policies
DROP POLICY IF EXISTS "Approved reviews are readable by everyone" ON public.reviews;
CREATE POLICY "Approved reviews are readable by everyone" ON public.reviews
  FOR SELECT TO public USING (moderation_status = 'approved');

DROP POLICY IF EXISTS "Travellers can create reviews" ON public.reviews;
CREATE POLICY "Travellers can create reviews" ON public.reviews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = traveller_id);

-- ====================================================================
-- STORAGE BUCKET CREATION & POLICIES (room-photos)
-- ====================================================================

-- Insert public bucket for room photos if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'room-photos',
  'room-photos',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Storage bucket RLS policies
DROP POLICY IF EXISTS "Room photos are publicly accessible" ON storage.objects;
CREATE POLICY "Room photos are publicly accessible" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'room-photos');

DROP POLICY IF EXISTS "Authenticated users can upload room photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload room photos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'room-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can update their own room photos" ON storage.objects;
CREATE POLICY "Users can update their own room photos" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'room-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete their own room photos" ON storage.objects;
CREATE POLICY "Users can delete their own room photos" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'room-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
