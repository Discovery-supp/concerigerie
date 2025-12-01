/*
  # Fix infinite recursion in properties RLS policies

  - Drops every existing policy to remove the recursive definition that queried
    the `properties` table inside its own USING/WITH CHECK clause.
  - Recreates a clean set of policies that avoid self-references:
      * Public read access to published & active listings
      * Owners can read their draft listings
      * Owners can insert/update/delete only their own listings
*/

BEGIN;

-- Ensure required boolean flags exist
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT false;

-- Backfill potential NULL values
UPDATE properties
SET
  is_active = COALESCE(is_active, true),
  is_published = COALESCE(is_published, false);

-- Make sure RLS is enabled (safe if it already is)
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies on properties to remove the recursive one(s)
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'properties'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.properties', pol.policyname);
    END LOOP;
END $$;

-- Public (anon + authenticated) can view published & active properties
CREATE POLICY "Public can view published properties"
  ON properties
  FOR SELECT
  TO anon, authenticated
  USING (
    COALESCE(is_published, false) = true
    AND COALESCE(is_active, true) = true
  );

-- Owners can view their own properties, even drafts
CREATE POLICY "Owners can view their properties"
  ON properties
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- Owners can insert listings that belong to them
CREATE POLICY "Owners can insert properties"
  ON properties
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- Owners can update their own properties
CREATE POLICY "Owners can update properties"
  ON properties
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Owners can delete their own properties
CREATE POLICY "Owners can delete properties"
  ON properties
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

COMMIT;

