-- Migration pour permettre aux utilisateurs de voir les profils nécessaires pour la messagerie
-- Problème: Les utilisateurs ne peuvent pas voir les profils des autres utilisateurs à cause des politiques RLS
-- Solution: Ajouter une politique qui permet de voir les profils nécessaires pour la messagerie

-- 1. Supprimer toutes les politiques existantes qui pourraient bloquer l'accès
DROP POLICY IF EXISTS "Users can view profiles for messaging" ON user_profiles;
DROP POLICY IF EXISTS "Users can view profiles linked to properties" ON user_profiles;

-- 2. Créer une politique permissive pour la messagerie
-- Cette politique permet aux utilisateurs authentifiés de voir les profils des autres utilisateurs
-- pour pouvoir envoyer des messages (nécessaire pour la fonctionnalité de messagerie)
-- IMPORTANT: Cette politique utilise 'true' pour permettre à TOUS les utilisateurs authentifiés
-- de voir TOUS les profils. C'est nécessaire pour la fonctionnalité de messagerie.
CREATE POLICY "Users can view profiles for messaging"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (true); -- Permet à tous les utilisateurs authentifiés de voir tous les profils

-- 3. Vérifier que RLS est activé
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. S'assurer que la politique "Users can view their own profile" existe toujours
-- (pour éviter de casser d'autres fonctionnalités)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_profiles' 
    AND policyname = 'Users can view their own profile'
  ) THEN
    CREATE POLICY "Users can view their own profile"
      ON user_profiles
      FOR SELECT
      TO authenticated
      USING (auth.uid() = id);
  END IF;
END $$;

-- 5. S'assurer que la politique pour les admins existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_profiles' 
    AND policyname = 'Admins can view all profiles'
  ) THEN
    CREATE POLICY "Admins can view all profiles"
      ON user_profiles
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 
          FROM user_profiles up
          WHERE up.id = auth.uid() 
          AND up.user_type IN ('admin', 'super_admin')
        )
      );
  END IF;
END $$;

-- 6. Commentaire pour expliquer la politique
COMMENT ON POLICY "Users can view profiles for messaging" ON user_profiles IS 
  'Permet à TOUS les utilisateurs authentifiés de voir TOUS les profils pour la messagerie. Politique permissive nécessaire pour permettre la création de nouveaux messages.';

