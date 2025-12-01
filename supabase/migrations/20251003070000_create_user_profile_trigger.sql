/*
  # Create profile on auth user signup

  - Adds function and trigger to insert into public.users when a new auth.users row is created
  - Reads raw_user_meta_data to populate first_name, last_name, phone, user_type
  - Safely handles missing metadata and sets defaults
*/

-- Function to create public profile from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger AS $$
DECLARE
  first_name text;
  last_name text;
  phone text;
  user_type text;
BEGIN
  -- Extract metadata (keys may vary: firstName/first_name, lastName/last_name)
  first_name := COALESCE((NEW.raw_user_meta_data->>'firstName'), (NEW.raw_user_meta_data->>'first_name'), '');
  last_name := COALESCE((NEW.raw_user_meta_data->>'lastName'), (NEW.raw_user_meta_data->>'last_name'), '');
  phone := COALESCE((NEW.raw_user_meta_data->>'phone'), '');
  user_type := COALESCE((NEW.raw_user_meta_data->>'userType'), (NEW.raw_user_meta_data->>'user_type'), 'traveler');

  -- Insert into public.users. If table uses a different schema name adjust accordingly
  INSERT INTO public.users (id, email, first_name, last_name, phone, user_type, created_at, updated_at)
  VALUES (NEW.id, NEW.email, first_name, last_name, phone, user_type, now(), now())
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- RLS: allow authenticated users to insert their profile if not present (defense-in-depth)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Authenticated users can insert their own profile' AND tablename = 'users'
  ) THEN
    CREATE POLICY "Authenticated users can insert their own profile" ON public.users
      FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;


