-- ============================================
-- CORRECTION DE LA RÉCURSION INFINIE DANS user_profiles
-- ============================================
-- 
-- PROBLÈME: Erreur "infinite recursion detected in policy for relation user_profiles"
-- CAUSE: La politique "Admins can view all profiles" utilise is_admin_user() qui
--        interroge user_profiles, déclenchant à nouveau RLS et créant une boucle infinie
--
-- SOLUTION: S'assurer que la fonction is_admin_user bypass vraiment RLS
--           en utilisant SECURITY DEFINER correctement configuré
--
-- ============================================
-- INSTRUCTIONS:
-- 1. Copiez ce script dans Supabase SQL Editor
-- 2. Exécutez-le complètement
-- 3. Testez en vous connectant en tant qu'admin et en listant les utilisateurs
-- ============================================

-- ÉTAPE 1: Supprimer TOUTES les politiques existantes pour éviter les conflits
-- On supprime toutes les politiques connues et on utilise aussi une approche dynamique

-- D'abord, supprimer explicitement toutes les politiques connues
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can delete profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can view profiles linked to properties" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Authenticated users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can read their own profile" ON user_profiles;

-- Ensuite, supprimer dynamiquement toutes les autres politiques qui pourraient exister
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Supprimer toutes les politiques existantes sur user_profiles
    FOR r IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'user_profiles'
          AND schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_profiles', r.policyname);
            RAISE NOTICE 'Politique supprimée: %', r.policyname;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Erreur lors de la suppression de la politique %: %', r.policyname, SQLERRM;
        END;
    END LOOP;
END $$;

-- ÉTAPE 2: Supprimer et recréer la fonction is_admin_user
-- avec une configuration qui garantit le bypass RLS
DROP FUNCTION IF EXISTS public.is_admin_user(uuid);

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
  -- Cette requête devrait bypass RLS car:
  -- 1. La fonction utilise SECURITY DEFINER
  -- 2. Elle s'exécute avec les privilèges du propriétaire de la fonction
  -- 3. En Supabase, les fonctions SECURITY DEFINER bypass RLS par défaut
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

-- ÉTAPE 3: S'assurer que la fonction appartient au bon rôle
-- En Supabase, cela devrait être automatique, mais on le spécifie explicitement
-- Note: Si vous obtenez une erreur ici, commentez cette ligne
-- ALTER FUNCTION public.is_admin_user(uuid) OWNER TO postgres;

-- ÉTAPE 4: Donner les permissions d'exécution
GRANT EXECUTE ON FUNCTION public.is_admin_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_user(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin_user(uuid) TO service_role;

-- ÉTAPE 5: Recréer les politiques RLS de manière sûre

-- Politique 1: Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view their own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Politique 2: Les admins peuvent voir tous les profils
-- IMPORTANT: Cette politique utilise is_admin_user() qui devrait maintenant
-- bypass RLS grâce à SECURITY DEFINER. Si cela cause encore des problèmes,
-- utilisez la solution alternative ci-dessous (commentée).
CREATE POLICY "Admins can view all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Si c'est son propre profil, autoriser (déjà couvert par la politique ci-dessus)
    auth.uid() = id
    OR
    -- Sinon, vérifier si l'utilisateur est admin via la fonction
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
    public.is_admin_user(auth.uid())
    AND EXISTS (
      SELECT 1 
      FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND up.user_type = 'super_admin'
    )
  );

-- ============================================
-- VÉRIFICATIONS
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
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'is_admin_user';

-- Vérifier le propriétaire de la fonction (utilise pg_proc au lieu de information_schema)
SELECT 
  p.proname as function_name,
  pg_get_userbyid(p.proowner) as owner,
  CASE WHEN p.prosecdef THEN 'DEFINER' ELSE 'INVOKER' END as security_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'is_admin_user';

-- ============================================
-- SI LE PROBLÈME PERSISTE
-- ============================================
-- Si vous obtenez encore l'erreur de récursion après avoir exécuté ce script,
-- utilisez la solution alternative ci-dessous qui évite complètement
-- d'utiliser is_admin_user dans les politiques RLS:

/*
-- SOLUTION ALTERNATIVE (à utiliser si le problème persiste):
-- Supprimer la politique admin et utiliser une approche différente

DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;

-- Créer une politique qui permet de voir les profils liés aux propriétés
-- (les admins pourront toujours voir les profils via d'autres moyens)
CREATE POLICY "Users can view profiles linked to properties"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR
    EXISTS (
      SELECT 1 
      FROM properties p
      WHERE p.owner_id = user_profiles.id
      AND p.is_published = true
    )
  );

-- Pour les fonctionnalités admin, vérifier le statut admin côté application
-- (dans votre code TypeScript/JavaScript) au lieu d'utiliser RLS
*/

-- ============================================
-- FIN DU SCRIPT
-- ============================================

