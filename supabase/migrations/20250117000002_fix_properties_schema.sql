/*
  # Correction et normalisation du schéma de la table properties
  
  Cette migration s'assure que toutes les colonnes nécessaires existent
  avec les bons types pour le formulaire d'annonce.
*/

-- Ajouter les colonnes manquantes si elles n'existent pas
DO $$
BEGIN
  -- Vérifier et ajouter/modifier amenities
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'amenities'
  ) THEN
    ALTER TABLE properties ADD COLUMN amenities jsonb DEFAULT '[]'::jsonb;
  ELSE
    -- Si la colonne existe mais est de type text[], la convertir en jsonb
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'properties' 
      AND column_name = 'amenities' 
      AND data_type = 'ARRAY'
    ) THEN
      -- Convertir text[] en jsonb en convertissant d'abord en json puis en jsonb
      ALTER TABLE properties 
      ALTER COLUMN amenities TYPE jsonb USING to_jsonb(amenities::text[]);
    END IF;
    
    -- S'assurer que les valeurs NULL sont remplacées
    ALTER TABLE properties 
    ALTER COLUMN amenities SET DEFAULT '[]'::jsonb;
  END IF;

  -- Vérifier et ajouter/modifier images
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'images'
  ) THEN
    ALTER TABLE properties ADD COLUMN images jsonb DEFAULT '[]'::jsonb;
  ELSE
    -- Convertir text[] en jsonb si nécessaire
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'properties' 
      AND column_name = 'images' 
      AND data_type = 'ARRAY'
    ) THEN
      ALTER TABLE properties 
      ALTER COLUMN images TYPE jsonb USING to_jsonb(images::text[]);
    END IF;
    
    -- S'assurer que les valeurs NULL sont remplacées
    ALTER TABLE properties 
    ALTER COLUMN images SET DEFAULT '[]'::jsonb;
  END IF;

  -- Vérifier et ajouter/modifier rules
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'rules'
  ) THEN
    ALTER TABLE properties ADD COLUMN rules jsonb DEFAULT '[]'::jsonb;
  ELSE
    -- Convertir text[] en jsonb si nécessaire
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'properties' 
      AND column_name = 'rules' 
      AND data_type = 'ARRAY'
    ) THEN
      ALTER TABLE properties 
      ALTER COLUMN rules TYPE jsonb USING to_jsonb(rules::text[]);
    END IF;
    
    -- S'assurer que les valeurs NULL sont remplacées
    ALTER TABLE properties 
    ALTER COLUMN rules SET DEFAULT '[]'::jsonb;
  END IF;

  -- Ajouter is_published si n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'is_published'
  ) THEN
    ALTER TABLE properties ADD COLUMN is_published boolean DEFAULT false;
  END IF;

  -- S'assurer que check_in_time et check_out_time sont de type text (pas time)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' 
    AND column_name = 'check_in_time' 
    AND data_type = 'time without time zone'
  ) THEN
    ALTER TABLE properties 
    ALTER COLUMN check_in_time TYPE text USING check_in_time::text;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' 
    AND column_name = 'check_out_time' 
    AND data_type = 'time without time zone'
  ) THEN
    ALTER TABLE properties 
    ALTER COLUMN check_out_time TYPE text USING check_out_time::text;
  END IF;

  -- Ajouter les colonnes si elles n'existent pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'check_in_time'
  ) THEN
    ALTER TABLE properties ADD COLUMN check_in_time text DEFAULT '14:00';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'check_out_time'
  ) THEN
    ALTER TABLE properties ADD COLUMN check_out_time text DEFAULT '11:00';
  END IF;

  -- Ajouter les colonnes de base si elles n'existent pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'surface'
  ) THEN
    ALTER TABLE properties ADD COLUMN surface integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'bedrooms'
  ) THEN
    ALTER TABLE properties ADD COLUMN bedrooms integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'bathrooms'
  ) THEN
    ALTER TABLE properties ADD COLUMN bathrooms integer DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'beds'
  ) THEN
    ALTER TABLE properties ADD COLUMN beds integer DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'max_guests'
  ) THEN
    ALTER TABLE properties ADD COLUMN max_guests integer DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'min_nights'
  ) THEN
    ALTER TABLE properties ADD COLUMN min_nights integer DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'max_nights'
  ) THEN
    ALTER TABLE properties ADD COLUMN max_nights integer DEFAULT 365;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'cleaning_fee'
  ) THEN
    ALTER TABLE properties ADD COLUMN cleaning_fee decimal(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'cancellation_policy'
  ) THEN
    ALTER TABLE properties ADD COLUMN cancellation_policy text DEFAULT 'flexible';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'category'
  ) THEN
    ALTER TABLE properties ADD COLUMN category text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'neighborhood'
  ) THEN
    ALTER TABLE properties ADD COLUMN neighborhood text;
  END IF;

  -- Ajouter price_per_night si n'existe pas (colonne essentielle)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'price_per_night'
  ) THEN
    ALTER TABLE properties ADD COLUMN price_per_night decimal(10,2) NOT NULL DEFAULT 0;
  END IF;

  -- Ajouter type si n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'type'
  ) THEN
    ALTER TABLE properties ADD COLUMN type text NOT NULL DEFAULT 'Appartement';
  END IF;

  -- Ajouter description si n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'description'
  ) THEN
    ALTER TABLE properties ADD COLUMN description text;
  END IF;

  -- Ajouter address si n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'address'
  ) THEN
    ALTER TABLE properties ADD COLUMN address text NOT NULL DEFAULT '';
  END IF;

  -- Ajouter owner_id si n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE properties ADD COLUMN owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

END $$;

-- Mettre à jour les valeurs NULL
UPDATE properties 
SET 
  amenities = COALESCE(amenities, '[]'::jsonb),
  images = COALESCE(images, '[]'::jsonb),
  rules = COALESCE(rules, '[]'::jsonb),
  check_in_time = COALESCE(check_in_time, '14:00'),
  check_out_time = COALESCE(check_out_time, '11:00'),
  surface = COALESCE(surface, 0),
  bedrooms = COALESCE(bedrooms, 0),
  bathrooms = COALESCE(bathrooms, 1),
  beds = COALESCE(beds, 1),
  max_guests = COALESCE(max_guests, 1),
  min_nights = COALESCE(min_nights, 1),
  max_nights = COALESCE(max_nights, 365),
  cleaning_fee = COALESCE(cleaning_fee, 0),
  cancellation_policy = COALESCE(cancellation_policy, 'flexible'),
  price_per_night = COALESCE(price_per_night, 0),
  type = COALESCE(type, 'Appartement'),
  address = COALESCE(address, ''),
  description = COALESCE(description, '')
WHERE 
  amenities IS NULL 
  OR images IS NULL 
  OR rules IS NULL 
  OR check_in_time IS NULL 
  OR check_out_time IS NULL
  OR surface IS NULL
  OR bedrooms IS NULL
  OR bathrooms IS NULL
  OR beds IS NULL
  OR max_guests IS NULL
  OR min_nights IS NULL
  OR max_nights IS NULL
  OR cleaning_fee IS NULL
  OR cancellation_policy IS NULL
  OR price_per_night IS NULL
  OR type IS NULL
  OR address IS NULL;

-- Commentaire pour documentation
COMMENT ON COLUMN properties.amenities IS 'Liste des équipements en format JSON array';
COMMENT ON COLUMN properties.images IS 'Liste des URLs d''images en format JSON array';
COMMENT ON COLUMN properties.rules IS 'Règles de la maison en format JSON array';

