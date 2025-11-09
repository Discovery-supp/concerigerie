-- Migration pour ajouter le champ blocked_dates et commune à la table properties

-- Ajouter le champ blocked_dates (jsonb pour stocker un tableau de dates)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' 
    AND column_name = 'blocked_dates'
  ) THEN
    ALTER TABLE properties 
    ADD COLUMN blocked_dates jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Ajouter le champ commune
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' 
    AND column_name = 'commune'
  ) THEN
    ALTER TABLE properties 
    ADD COLUMN commune text;
  END IF;
END $$;

-- Ajouter les champs latitude et longitude pour la géolocalisation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' 
    AND column_name = 'latitude'
  ) THEN
    ALTER TABLE properties 
    ADD COLUMN latitude decimal(10, 8);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' 
    AND column_name = 'longitude'
  ) THEN
    ALTER TABLE properties 
    ADD COLUMN longitude decimal(11, 8);
  END IF;
END $$;

-- Ajouter le champ image_captions pour les légendes des photos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' 
    AND column_name = 'image_captions'
  ) THEN
    ALTER TABLE properties 
    ADD COLUMN image_captions jsonb;
  END IF;
END $$;

-- Créer un index sur blocked_dates pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_properties_blocked_dates ON properties USING GIN (blocked_dates);

