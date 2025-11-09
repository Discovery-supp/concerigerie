-- Migration pour ajouter les colonnes de frais manquantes à la table reservations
-- Ces colonnes sont nécessaires pour stocker les détails de calcul des prix

-- Ajouter subtotal si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservations' AND column_name = 'subtotal'
    ) THEN
        ALTER TABLE reservations 
        ADD COLUMN subtotal decimal(10,2) NOT NULL DEFAULT 0;
    END IF;
END $$;

-- Ajouter cleaning_fee si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservations' AND column_name = 'cleaning_fee'
    ) THEN
        ALTER TABLE reservations 
        ADD COLUMN cleaning_fee decimal(10,2) DEFAULT 0;
    END IF;
END $$;

-- Ajouter service_fee si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservations' AND column_name = 'service_fee'
    ) THEN
        ALTER TABLE reservations 
        ADD COLUMN service_fee decimal(10,2) DEFAULT 0;
    END IF;
END $$;

-- Ajouter tourist_tax si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservations' AND column_name = 'tourist_tax'
    ) THEN
        ALTER TABLE reservations 
        ADD COLUMN tourist_tax decimal(10,2) DEFAULT 0;
    END IF;
END $$;

