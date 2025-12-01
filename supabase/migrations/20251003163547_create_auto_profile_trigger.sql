/*
  # Create automatic user profile creation trigger

  1. Changes
    - Create function to automatically create user_profile when auth.users record is created
    - Create trigger on auth.users table to call this function
    - Drop the manual INSERT policy on user_profiles (no longer needed)
    - Create new policies for authenticated users only
  
  2. Security
    - Automatic profile creation happens in security definer context
    - Users can only read/update their own profiles
    - No manual profile creation allowed
*/

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, user_type, created_at, updated_at)
  VALUES (NEW.id, 'traveler', now(), now());
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Drop the old INSERT policy
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;

-- Revoke INSERT from anon
REVOKE INSERT ON user_profiles FROM anon;

-- Create new UPDATE policy for authenticated users to update their profiles
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);