-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'voter');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  class TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Create security definer function to check roles
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

-- Create registration_codes table
CREATE TABLE public.registration_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  used_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ
);

ALTER TABLE public.registration_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage registration codes"
  ON public.registration_codes FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view unused codes for registration"
  ON public.registration_codes FOR SELECT
  USING (NOT is_used);

-- Create candidates table
CREATE TABLE public.candidates (
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

CREATE POLICY "Everyone can view candidates"
  ON public.candidates FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins can manage candidates"
  ON public.candidates FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create votes table
CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE NOT NULL,
  voted_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Voters can view their own vote"
  ON public.votes FOR SELECT
  USING (auth.uid() = voter_id);

CREATE POLICY "Voters can insert their own vote once"
  ON public.votes FOR INSERT
  WITH CHECK (auth.uid() = voter_id AND NOT EXISTS (
    SELECT 1 FROM public.votes WHERE voter_id = auth.uid()
  ));

CREATE POLICY "Admins can view all votes"
  ON public.votes FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger to update profile on user creation
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for votes table
ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;

-- Insert default admin code (code: ADMIN2024)
INSERT INTO public.registration_codes (code) VALUES ('ADMIN2024');