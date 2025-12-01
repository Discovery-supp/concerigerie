/*
  # Ajout du type super_admin
  
  Cette migration ajoute le type 'super_admin' à la liste des types d'utilisateurs valides.
  Les super admins sont les seuls à pouvoir créer des comptes admin.
*/

-- Modifier la contrainte CHECK pour inclure 'super_admin'
DO $$
BEGIN
  -- Supprimer l'ancienne contrainte si elle existe
  ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_type_check;
  
  -- Recréer la contrainte avec super_admin inclus
  ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_user_type_check 
    CHECK (user_type IN ('owner', 'provider', 'partner', 'admin', 'super_admin', 'traveler'));
END $$;

-- Créer un index pour améliorer les performances si nécessaire
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_type ON user_profiles(user_type);

-- Commentaire pour documentation
COMMENT ON COLUMN user_profiles.user_type IS 'Type d''utilisateur: super_admin (créer admins), admin (gestion standard), owner, traveler, provider, partner';

