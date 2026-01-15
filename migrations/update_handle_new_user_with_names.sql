-- Update handle_new_user function to populate first_name, last_name, and full_name

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_first_name TEXT;
  v_last_name TEXT;
  v_full_name TEXT;
BEGIN
  -- Extract names from raw_user_meta_data
  v_first_name := new.raw_user_meta_data->>'first_name';
  v_last_name := new.raw_user_meta_data->>'last_name';
  v_full_name := new.raw_user_meta_data->>'full_name';
  
  -- If full_name is provided but not first/last, try to split it
  IF v_full_name IS NOT NULL AND v_first_name IS NULL AND v_last_name IS NULL THEN
    v_first_name := split_part(v_full_name, ' ', 1);
    v_last_name := NULLIF(substring(v_full_name from position(' ' in v_full_name) + 1), '');
  END IF;
  
  -- Insert user profile with name fields
  INSERT INTO public.user_profiles (
    id,
    username,
    first_name,
    last_name,
    full_name,
    avatar_url,
    role,
    onboarding_completed,
    preferences_completed
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    v_first_name,
    v_last_name,
    v_full_name,
    new.raw_user_meta_data->>'avatar_url',
    'USER',
    false,
    false
  );
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
