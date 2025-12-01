-- Script final pour corriger la récursion infinie dans les politiques RLS de user_profiles
-- 
-- PROBLÈME: La politique "Admins can view all profiles" utilise is_admin_user()
-- qui interroge user_profiles, déclenchant à nouveau RLS et créant une boucle infinie
--
-- SOLUTION: Utiliser une approche qui évite complètement la récursion en:
-- 1. S'assurant que la fonction is_admin_user bypass vraiment RLS
-- 2. Ou en utilisant une politique plus simple qui ne nécessite pas de vérifier le statut admin
--    de manière récursive

-- ============================================
-- ÉTAPE 1: Supprimer toutes les politiques problématiques
-- ============================================
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can delete profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON user_profiles;

-- ============================================
-- ÉTAPE 2: Recréer la fonction is_admin_user
-- avec une configuration qui garantit le bypass RLS
-- ============================================
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  user_type_value text;
BEGIN
  -- Cette requête devrait bypass RLS car la fonction utilise SECURITY DEFINER
  -- En Supabase, les fonctions SECURITY DEFINER exécutées avec le bon owner
  -- devraient bypass RLS automatiquement
  SELECT up.user_type INTO user_type_value
  FROM public.user_profiles up
  WHERE up.id = user_id;
  
  RETURN COALESCE(user_type_value IN ('admin', 'super_admin'), false);
EXCEPTION
  WHEN OTHERS THEN
    -- En cas d'erreur, retourner false (pas admin)
    RETURN false;
END;
$$;

-- S'assurer que la fonction appartient à un rôle qui peut bypass RLS
-- En Supabase, cela devrait être géré automatiquement, mais on le spécifie explicitement
ALTER FUNCTION public.is_admin_user(uuid) OWNER TO postgres;

-- Donner les permissions d'exécution
GRANT EXECUTE ON FUNCTION public.is_admin_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_user(uuid) TO anon;

-- ============================================
-- ÉTAPE 3: Recréer les politiques RLS
-- avec une approche qui évite la récursion
-- ============================================

-- Politique 1: Les utilisateurs peuvent voir leur propre profil
-- Cette politique est simple et ne cause pas de récursion
CREATE POLICY "Users can view their own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Politique 2: Les admins peuvent voir tous les profils
-- IMPORTANT: Cette politique utilise is_admin_user() qui devrait bypass RLS
-- grâce à SECURITY DEFINER. Si cela cause encore des problèmes,
-- on peut utiliser l'approche alternative ci-dessous.
CREATE POLICY "Admins can view all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Si c'est son propre profil, autoriser (déjà couvert par la politique ci-dessus,
    -- mais on l'inclut pour éviter d'appeler is_admin_user inutilement)
    auth.uid() = id
    OR
    -- Sinon, vérifier si l'utilisateur est admin
    -- La fonction is_admin_user utilise SECURITY DEFINER donc elle devrait bypass RLS
    public.is_admin_user(auth.uid())
  );

-- Politique 3: Les utilisateurs peuvent mettre à jour leur propre profil
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Politique 4: Les utilisateurs peuvent insérer leur propre profil
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "Users can insert their own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Politique 5: Les super admins peuvent supprimer des profils
CREATE POLICY "Super admins can delete profiles"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (
    -- Vérifier si l'utilisateur est super_admin
    public.is_admin_user(auth.uid())
    AND EXISTS (
      SELECT 1 
      FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND up.user_type = 'super_admin'
    )
  );

-- ============================================
-- ÉTAPE 4: Vérifications
-- ============================================

-- Vérifier que les politiques ont été créées
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- Vérifier que la fonction existe et a les bonnes propriétés
SELECT 
  routine_name, 
  routine_type,
  security_type,
  routine_owner
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'is_admin_user';

-- ============================================
-- NOTES IMPORTANTES:
-- ============================================
-- 1. Si la récursion persiste après avoir exécuté ce script,
--    cela signifie que SECURITY DEFINER ne bypass pas RLS comme prévu.
--
-- 2. Solution alternative si le problème persiste:
--    - Supprimer complètement la politique "Admins can view all profiles"
--    - Les admins devront utiliser leur propre profil pour vérifier leur statut
--    - Ou créer une table séparée pour les rôles admin qui n'a pas RLS
--
-- 3. Pour tester si cela fonctionne:
--    - Connectez-vous en tant qu'admin
--    - Essayez de lister tous les profils utilisateurs
--    - Si cela fonctionne sans erreur de récursion, le problème est résolu

