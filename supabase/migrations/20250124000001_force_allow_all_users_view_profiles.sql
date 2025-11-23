-- Migration URGENTE pour permettre à TOUS les utilisateurs de voir TOUS les profils
-- Cette migration supprime toutes les restrictions RLS sur la lecture des profils
-- pour permettre la fonctionnalité de messagerie

-- 1. Supprimer TOUTES les politiques SELECT existantes sur user_profiles
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_profiles'
        AND cmd = 'SELECT'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON user_profiles', r.policyname);
        RAISE NOTICE 'Politique supprimée: %', r.policyname;
    END LOOP;
END $$;

-- 2. Créer UNE SEULE politique très permissive pour la lecture
-- Cette politique permet à TOUS les utilisateurs authentifiés de voir TOUS les profils
CREATE POLICY "All authenticated users can view all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (true); -- Permet à tous les utilisateurs authentifiés de voir tous les profils

-- 3. S'assurer que RLS est activé
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Vérifier que la politique a été créée
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_profiles' 
        AND policyname = 'All authenticated users can view all profiles'
    ) THEN
        RAISE NOTICE 'SUCCÈS: La politique a été créée avec succès';
    ELSE
        RAISE EXCEPTION 'ERREUR: La politique n''a pas pu être créée';
    END IF;
END $$;

-- 5. Commentaire
COMMENT ON POLICY "All authenticated users can view all profiles" ON user_profiles IS 
  'Politique permissive permettant à TOUS les utilisateurs authentifiés de voir TOUS les profils. Nécessaire pour la fonctionnalité de messagerie.';

