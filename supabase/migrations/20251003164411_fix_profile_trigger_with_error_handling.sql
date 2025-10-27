/*
  # Fix profile creation trigger with error handling

  1. Changes
    - Update handle_new_user function to handle errors gracefully
    - Add ON CONFLICT clause to prevent duplicate key errors
    - Add exception handling for foreign key violations
  
  2. Security
    - Maintains SECURITY DEFINER for automatic profile creation
    - Handles edge cases without breaking user signup
*/

-- Drop and recreate the function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert profile with ON CONFLICT to handle duplicates
  INSERT INTO public.user_profiles (id, user_type, created_at, updated_at)
  VALUES (NEW.id, 'traveler', now(), now())
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Could not create user profile: %', SQLERRM;
    RETURN NEW;
END;
$$;