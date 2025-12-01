/*
  # Migration complète pour s'assurer que TOUTES les colonnes existent
  
  Cette migration crée la table properties avec TOUTES les colonnes nécessaires
  si elle n'existe pas, ou ajoute les colonnes manquantes si elle existe déjà.
*/

-- Créer la table properties avec toutes les colonnes si elle n'existe pas
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'Appartement',
  address text NOT NULL DEFAULT '',
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

-- Ajouter toutes les colonnes qui pourraient manquer (même si la table existe)
DO $$
BEGIN
  -- Colonnes de base
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'owner_id') THEN
    ALTER TABLE properties ADD COLUMN owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'title') THEN
    ALTER TABLE properties ADD COLUMN title text NOT NULL DEFAULT '';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'description') THEN
    ALTER TABLE properties ADD COLUMN description text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'type') THEN
    ALTER TABLE properties ADD COLUMN type text NOT NULL DEFAULT 'Appartement';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'address') THEN
    ALTER TABLE properties ADD COLUMN address text NOT NULL DEFAULT '';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'price_per_night') THEN
    ALTER TABLE properties ADD COLUMN price_per_night decimal(10,2) NOT NULL DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'surface') THEN
    ALTER TABLE properties ADD COLUMN surface integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'max_guests') THEN
    ALTER TABLE properties ADD COLUMN max_guests integer DEFAULT 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'bedrooms') THEN
    ALTER TABLE properties ADD COLUMN bedrooms integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'bathrooms') THEN
    ALTER TABLE properties ADD COLUMN bathrooms integer DEFAULT 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'beds') THEN
    ALTER TABLE properties ADD COLUMN beds integer DEFAULT 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'cleaning_fee') THEN
    ALTER TABLE properties ADD COLUMN cleaning_fee decimal(10,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'min_nights') THEN
    ALTER TABLE properties ADD COLUMN min_nights integer DEFAULT 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'max_nights') THEN
    ALTER TABLE properties ADD COLUMN max_nights integer DEFAULT 365;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'amenities') THEN
    ALTER TABLE properties ADD COLUMN amenities jsonb DEFAULT '[]'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'images') THEN
    ALTER TABLE properties ADD COLUMN images jsonb DEFAULT '[]'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'rules') THEN
    ALTER TABLE properties ADD COLUMN rules jsonb DEFAULT '[]'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'cancellation_policy') THEN
    ALTER TABLE properties ADD COLUMN cancellation_policy text DEFAULT 'flexible';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'check_in_time') THEN
    ALTER TABLE properties ADD COLUMN check_in_time text DEFAULT '14:00';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'check_out_time') THEN
    ALTER TABLE properties ADD COLUMN check_out_time text DEFAULT '11:00';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'category') THEN
    ALTER TABLE properties ADD COLUMN category text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'neighborhood') THEN
    ALTER TABLE properties ADD COLUMN neighborhood text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'beach_access') THEN
    ALTER TABLE properties ADD COLUMN beach_access boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'is_published') THEN
    ALTER TABLE properties ADD COLUMN is_published boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'created_at') THEN
    ALTER TABLE properties ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'updated_at') THEN
    ALTER TABLE properties ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Activer RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS de base si elles n'existent pas
DO $$
BEGIN
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

