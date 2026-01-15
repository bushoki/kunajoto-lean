-- Create a table for user profiles, linked to Supabase Auth
CREATE TABLE public.user_profiles (
    id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
    username text UNIQUE,
    full_name text,
    avatar_url text,
    role text DEFAULT 'user'::text NOT NULL,
    preferences jsonb DEFAULT '{}'::jsonb,
    onboarding_completed boolean DEFAULT false NOT NULL,
    preferences_completed boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS for user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles
CREATE POLICY "Users can view their own profile." ON public.user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.user_profiles FOR UPDATE USING (auth.uid() = id);

-- Create a table for venues
CREATE TABLE public.venues (
    id text NOT NULL PRIMARY KEY,
    name text NOT NULL,
    type text,
    image_url text,
    latitude double precision,
    longitude double precision,
    vibe_score integer,
    vibe_confidence text,
    vibe_trend text,
    district text,
    description text,
    price_level integer,
    is_promoted boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS for venues
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

-- Policies for venues (Read-only for all, Admin can insert/update/delete)
CREATE POLICY "Allow all users to read venues." ON public.venues FOR SELECT USING (true);

-- Create a table for user favorites
CREATE TABLE public.user_favorites (
    user_id uuid REFERENCES auth.users NOT NULL,
    venue_id text REFERENCES public.venues NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    PRIMARY KEY (user_id, venue_id)
);

-- Enable RLS for user_favorites
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Policies for user_favorites
CREATE POLICY "Users can view their own favorites." ON public.user_favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own favorites." ON public.user_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own favorites." ON public.user_favorites FOR DELETE USING (auth.uid() = user_id);

-- Create a table for reviews (user-generated content)
CREATE TABLE public.reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users NOT NULL,
    venue_id text REFERENCES public.venues NOT NULL,
    rating integer NOT NULL,
    text text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS for reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policies for reviews
CREATE POLICY "Allow all users to read reviews." ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert their own reviews." ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reviews." ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reviews." ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- Create a table for static/admin data (e.g., services, plans, ticker_sources)
CREATE TABLE public.app_data (
    key text NOT NULL PRIMARY KEY,
    data jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS for app_data
ALTER TABLE public.app_data ENABLE ROW LEVEL SECURITY;

-- Policies for app_data (Read-only for all)
CREATE POLICY "Allow all users to read app_data." ON public.app_data FOR SELECT USING (true);

-- Function to handle new user sign-ups (create profile)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS 1570
BEGIN
  INSERT INTO public.user_profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
1570 LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_user on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

