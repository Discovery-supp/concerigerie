-- Script SQL pour corriger la table properties
-- À exécuter dans l'éditeur SQL de Supabase
-- Ce script ajoute toutes les colonnes manquantes en une seule fois

-- Créer la table si elle n'existe pas (avec toutes les colonnes)
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

-- Ajouter toutes les colonnes manquantes une par une
ALTER TABLE properties ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT '';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'Appartement';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS address text NOT NULL DEFAULT '';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS neighborhood text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS surface integer DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS max_guests integer DEFAULT 1;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS bedrooms integer DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS bathrooms integer DEFAULT 1;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS beds integer DEFAULT 1;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS price_per_night decimal(10,2) NOT NULL DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS cleaning_fee decimal(10,2) DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS min_nights integer DEFAULT 1;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS max_nights integer DEFAULT 365;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS amenities jsonb DEFAULT '[]'::jsonb;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]'::jsonb;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS rules jsonb DEFAULT '[]'::jsonb;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS cancellation_policy text DEFAULT 'flexible';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS check_in_time text DEFAULT '14:00';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS check_out_time text DEFAULT '11:00';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS beach_access boolean DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE properties ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Activer RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS de base
DROP POLICY IF EXISTS "Public can read published properties" ON properties;
CREATE POLICY "Public can read published properties" ON properties
  FOR SELECT TO anon, authenticated
  USING (is_published = true OR owner_id = auth.uid());

DROP POLICY IF EXISTS "Owners can manage their properties" ON properties;
CREATE POLICY "Owners can manage their properties" ON properties
  FOR ALL TO authenticated
  USING (owner_id = auth.uid());

-- Vérification: Lister toutes les colonnes de la table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'properties'
ORDER BY ordinal_position;

