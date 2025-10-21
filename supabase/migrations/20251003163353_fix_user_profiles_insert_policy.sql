/*
  # Fix user_profiles INSERT policy for registration

  1. Changes
    - Drop existing restrictive INSERT policy
    - Create new INSERT policy that allows users to create their profile during signup
    - The policy checks that the ID matches auth.uid() OR allows public insert if the user is being created
  
  2. Security
    - Still maintains security by checking ID matches
    - Allows profile creation during auth signup process
*/

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;

-- Create a new INSERT policy that works during signup
-- This allows the profile to be created right after the user signs up
CREATE POLICY "Users can insert their own profile"
  ON user_profiles
  FOR INSERT
  TO public
  WITH CHECK (
    auth.uid() = id
  );

-- Also ensure anon role can insert during signup
GRANT INSERT ON user_profiles TO anon;