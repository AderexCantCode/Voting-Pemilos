/*
  # Create Voting System Schema

  1. New Tables
    - `profiles` - User profile information
    - `user_roles` - User role assignments
    - `registration_codes` - Registration codes for users
    - `candidates` - Candidate information
    - `votes` - Vote records

  2. Security
    - Enable RLS on all tables
    - Add policies for secure data access

  3. Storage
    - Create bucket for candidate photos
    - Add storage policies
*/

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'voter');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  class TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view their own profile'
  ) THEN
    CREATE POLICY "Users can view their own profile"
      ON public.profiles FOR SELECT
      USING (auth.uid() = id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile"
      ON public.profiles FOR UPDATE
      USING (auth.uid() = id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'Users can view their own roles'
  ) THEN
    CREATE POLICY "Users can view their own roles"
      ON public.user_roles FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE TABLE IF NOT EXISTS public.registration_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  used_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ
);

ALTER TABLE public.registration_codes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'registration_codes' AND policyname = 'Admins can manage registration codes'
  ) THEN
    CREATE POLICY "Admins can manage registration codes"
      ON public.registration_codes FOR ALL
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'registration_codes' AND policyname = 'Anyone can view unused codes for registration'
  ) THEN
    CREATE POLICY "Anyone can view unused codes for registration"
      ON public.registration_codes FOR SELECT
      USING (NOT is_used);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_number INTEGER UNIQUE NOT NULL,
  chairman_name TEXT NOT NULL,
  vice_chairman_name TEXT NOT NULL,
  chairman_photo TEXT,
  vice_chairman_photo TEXT,
  vision TEXT,
  mission TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'candidates' AND policyname = 'Everyone can view candidates'
  ) THEN
    CREATE POLICY "Everyone can view candidates"
      ON public.candidates FOR SELECT
      USING (TRUE);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'candidates' AND policyname = 'Admins can manage candidates'
  ) THEN
    CREATE POLICY "Admins can manage candidates"
      ON public.candidates FOR ALL
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE NOT NULL,
  voted_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'votes' AND policyname = 'Voters can view their own vote'
  ) THEN
    CREATE POLICY "Voters can view their own vote"
      ON public.votes FOR SELECT
      USING (auth.uid() = voter_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'votes' AND policyname = 'Voters can insert their own vote once'
  ) THEN
    CREATE POLICY "Voters can insert their own vote once"
      ON public.votes FOR INSERT
      WITH CHECK (auth.uid() = voter_id AND NOT EXISTS (
        SELECT 1 FROM public.votes WHERE voter_id = auth.uid()
      ));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'votes' AND policyname = 'Admins can view all votes'
  ) THEN
    CREATE POLICY "Admins can view all votes"
      ON public.votes FOR SELECT
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, class)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'class', '')
  );
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'votes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;
  END IF;
END $$;

INSERT INTO public.registration_codes (code) 
VALUES ('ADMIN2024')
ON CONFLICT (code) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('candidate-photos', 'candidate-photos', true) 
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Anyone can view candidate photos'
  ) THEN
    CREATE POLICY "Anyone can view candidate photos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'candidate-photos');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admins can upload candidate photos'
  ) THEN
    CREATE POLICY "Admins can upload candidate photos"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'candidate-photos' AND
      auth.uid() IN (
        SELECT user_id FROM public.user_roles WHERE role = 'admin'
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admins can delete candidate photos'
  ) THEN
    CREATE POLICY "Admins can delete candidate photos"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'candidate-photos' AND
      auth.uid() IN (
        SELECT user_id FROM public.user_roles WHERE role = 'admin'
      )
    );
  END IF;
END $$;
