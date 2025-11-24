-- Ajouter la colonne is_active à la table user_profiles si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE user_profiles 
        ADD COLUMN is_active BOOLEAN DEFAULT true NOT NULL;
        
        -- Mettre à jour tous les utilisateurs existants comme actifs par défaut
        UPDATE user_profiles SET is_active = true WHERE is_active IS NULL;
    END IF;
END $$;

-- Ajouter la colonne is_active à la table service_providers si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'service_providers' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE service_providers 
        ADD COLUMN is_active BOOLEAN DEFAULT true NOT NULL;
        
        -- Mettre à jour tous les prestataires existants comme actifs par défaut
        UPDATE service_providers SET is_active = true WHERE is_active IS NULL;
    END IF;
END $$;

-- Créer un index pour améliorer les performances des requêtes de filtrage
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON user_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_service_providers_is_active ON service_providers(is_active);
