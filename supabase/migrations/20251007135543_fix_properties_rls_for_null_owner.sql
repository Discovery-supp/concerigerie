/*
  # Fix RLS Policy for Properties with Null Owner
  
  1. Updates
    - Drop the existing SELECT policy that prevents access to properties with null owner_id
    - Create a new policy that allows public read access to all published properties
    - Keeps other policies intact for authenticated users to manage their properties
  
  2. Security
    - Allows anonymous users to view all published properties regardless of owner_id
    - Maintains restrictions for INSERT, UPDATE, DELETE operations
*/

-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "Anyone can view published properties" ON properties;

-- Create a new policy that allows viewing all published properties
CREATE POLICY "Public can view published properties"
  ON properties
  FOR SELECT
  TO public
  USING (is_published = true);

-- Add a separate policy for owners to view their own properties (published or not)
CREATE POLICY "Owners can view their own properties"
  ON properties
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());
