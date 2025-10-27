/*
  # Enhanced User Profile Trigger with Metadata

  1. Updates
    - Update handle_new_user function to extract metadata from auth.users
    - Store firstName, lastName, phone, and userType from signup data
    - Maintain error handling and duplicate prevention
  
  2. Security
    - Maintains SECURITY DEFINER for automatic profile creation
    - Safely handles missing metadata with defaults
*/

-- Drop and recreate the function with metadata extraction
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert profile with metadata from auth.users.raw_user_meta_data
  INSERT INTO public.user_profiles (
    id, 
    first_name, 
    last_name, 
    phone, 
    user_type, 
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'firstName', ''),
    COALESCE(NEW.raw_user_meta_data->>'lastName', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'userType', 'traveler'),
    now(), 
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = COALESCE(EXCLUDED.first_name, user_profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, user_profiles.last_name),
    phone = COALESCE(EXCLUDED.phone, user_profiles.phone),
    user_type = COALESCE(EXCLUDED.user_type, user_profiles.user_type),
    updated_at = now();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Could not create user profile: %', SQLERRM;
    RETURN NEW;
END;
$$;