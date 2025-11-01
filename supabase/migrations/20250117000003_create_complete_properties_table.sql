/*
  # Création complète de la table properties si elle n'existe pas
  
  Cette migration crée la table properties avec toutes les colonnes nécessaires
  au cas où elle n'existerait pas encore.
*/

-- Créer la table properties si elle n'existe pas
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  type text NOT NULL,
  address text NOT NULL,
  category text,
  neighborhood text,
  surface integer DEFAULT 0,
  max_guests integer DEFAULT 1,
  bedrooms integer DEFAULT 0,
  bathrooms integer DEFAULT 1,
  beds integer DEFAULT 1,
  price_per_night decimal(10,2) NOT NULL DEFAULT 0,
  cleaning_fee decimal(10,2) DEFAULT 0,
  min_nights integer DEFAULT 1,
  max_nights integer DEFAULT 365,
  amenities jsonb DEFAULT '[]'::jsonb,
  images jsonb DEFAULT '[]'::jsonb,
  rules jsonb DEFAULT '[]'::jsonb,
  cancellation_policy text DEFAULT 'flexible',
  check_in_time text DEFAULT '14:00',
  check_out_time text DEFAULT '11:00',
  beach_access boolean DEFAULT false,
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activer RLS si pas déjà activé
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS si elles n'existent pas
DO $$
BEGIN
  -- Politique pour la lecture publique
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'properties' 
    AND policyname = 'Public can read published properties'
  ) THEN
    CREATE POLICY "Public can read published properties" ON properties
      FOR SELECT TO anon, authenticated
      USING (is_published = true OR owner_id = auth.uid());
  END IF;

  -- Politique pour les propriétaires
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'properties' 
    AND policyname = 'Owners can manage their properties'
  ) THEN
    CREATE POLICY "Owners can manage their properties" ON properties
      FOR ALL TO authenticated
      USING (owner_id = auth.uid());
  END IF;
END $$;

-- Créer les index si ils n'existent pas
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_is_published ON properties(is_published);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
CREATE INDEX IF NOT EXISTS idx_properties_category ON properties(category);

