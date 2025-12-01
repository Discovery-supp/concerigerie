-- Script SQL à exécuter dans Supabase pour ajouter les colonnes manquantes
-- Copiez ce script et exécutez-le dans l'éditeur SQL de Supabase

-- Ajouter subtotal si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reservations' 
        AND column_name = 'subtotal'
    ) THEN
        ALTER TABLE reservations 
        ADD COLUMN subtotal decimal(10,2) NOT NULL DEFAULT 0;
        RAISE NOTICE 'Colonne subtotal ajoutée';
    ELSE
        RAISE NOTICE 'Colonne subtotal existe déjà';
    END IF;
END $$;

-- Ajouter cleaning_fee si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reservations' 
        AND column_name = 'cleaning_fee'
    ) THEN
        ALTER TABLE reservations 
        ADD COLUMN cleaning_fee decimal(10,2) DEFAULT 0;
        RAISE NOTICE 'Colonne cleaning_fee ajoutée';
    ELSE
        RAISE NOTICE 'Colonne cleaning_fee existe déjà';
    END IF;
END $$;

-- Ajouter service_fee si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reservations' 
        AND column_name = 'service_fee'
    ) THEN
        ALTER TABLE reservations 
        ADD COLUMN service_fee decimal(10,2) DEFAULT 0;
        RAISE NOTICE 'Colonne service_fee ajoutée';
    ELSE
        RAISE NOTICE 'Colonne service_fee existe déjà';
    END IF;
END $$;

-- Ajouter tourist_tax si elle n'existe pas (optionnel, pour usage futur)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reservations' 
        AND column_name = 'tourist_tax'
    ) THEN
        ALTER TABLE reservations 
        ADD COLUMN tourist_tax decimal(10,2) DEFAULT 0;
        RAISE NOTICE 'Colonne tourist_tax ajoutée';
    ELSE
        RAISE NOTICE 'Colonne tourist_tax existe déjà';
    END IF;
END $$;

-- Vérifier que les colonnes ont été ajoutées
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'reservations' 
AND column_name IN ('subtotal', 'cleaning_fee', 'service_fee', 'tourist_tax')
ORDER BY column_name;

