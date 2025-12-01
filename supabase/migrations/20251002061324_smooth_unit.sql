/*
  # Ajout de la colonne user_type à la table users

  1. Modifications
    - Ajouter la colonne `user_type` à la table `users` si elle n'existe pas
    - Définir une valeur par défaut 'traveler'
    - Ajouter une contrainte CHECK pour valider les valeurs

  2. Sécurité
    - Maintenir les politiques RLS existantes
    - Aucun impact sur la sécurité
*/

-- Ajouter la colonne user_type si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'user_type'
  ) THEN
    ALTER TABLE users ADD COLUMN user_type text NOT NULL DEFAULT 'traveler';
    
    -- Ajouter une contrainte pour valider les valeurs
    ALTER TABLE users ADD CONSTRAINT users_user_type_check 
    CHECK (user_type IN ('owner', 'traveler', 'partner', 'provider', 'admin'));
  END IF;
END $$;

-- Mettre à jour les utilisateurs existants qui n'ont pas de user_type
UPDATE users 
SET user_type = 'traveler' 
WHERE user_type IS NULL OR user_type = '';

-- Créer un index pour améliorer les performances des requêtes par type d'utilisateur
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);