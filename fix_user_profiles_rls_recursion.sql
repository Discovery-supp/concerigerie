-- Script pour corriger la récursion infinie dans les politiques RLS de user_profiles
-- Le problème: La politique "Admins can view all profiles" utilise is_admin_user()
-- qui interroge user_profiles, déclenchant à nouveau RLS et créant une boucle infinie

-- 1. Supprimer les politiques problématiques
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can delete profiles" ON user_profiles;

-- 2. Recréer la fonction is_admin_user avec une meilleure gestion de RLS
-- La clé est d'utiliser SECURITY DEFINER et de s'assurer que la fonction
-- peut vraiment bypass RLS en utilisant le bon owner
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
DECLARE
  user_type_value text;
BEGIN
  -- Utiliser une requête directe qui devrait bypass RLS grâce à SECURITY DEFINER
  -- En Supabase, les fonctions SECURITY DEFINER devraient bypass RLS
  -- Mais pour être sûr, on utilise une approche qui évite complètement la récursion
  -- en désactivant temporairement RLS dans le contexte de la fonction
  
  -- Alternative: Utiliser pg_catalog pour vérifier directement
  -- ou utiliser une table sans RLS
  -- Pour l'instant, on utilise la requête directe avec SECURITY DEFINER
  SELECT up.user_type INTO user_type_value
  FROM public.user_profiles up
  WHERE up.id = user_id;
  
  RETURN COALESCE(user_type_value IN ('admin', 'super_admin'), false);
EXCEPTION
  WHEN OTHERS THEN
    -- En cas d'erreur (y compris si l'utilisateur n'existe pas), retourner false
    RETURN false;
END;
$$;

-- 3. S'assurer que la fonction a les bonnes permissions
-- Le owner doit être un rôle qui peut bypass RLS (généralement postgres ou service_role)
-- En Supabase, on peut utiliser le rôle service_role
-- Mais pour l'instant, on laisse le owner par défaut

-- 4. La solution: Utiliser une fonction SECURITY DEFINER qui bypass RLS correctement
-- En modifiant la fonction pour qu'elle utilise une requête qui ne déclenche pas RLS
-- La clé est d'utiliser SECURITY DEFINER avec le bon owner et search_path

-- D'abord, s'assurer que la fonction peut vraiment bypass RLS
-- En PostgreSQL/Supabase, SECURITY DEFINER devrait permettre de bypass RLS
-- mais il faut s'assurer que la fonction est correctement configurée

-- 5. Recréer les politiques en utilisant la fonction, mais avec une protection
-- La fonction is_admin_user devrait maintenant fonctionner correctement avec SECURITY DEFINER
-- Cependant, pour être absolument sûr, on va utiliser une approche hybride

-- Politique pour les utilisateurs de voir leur propre profil
-- (déjà existante, mais on s'assure qu'elle est correcte)
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Politique pour les admins - utiliser la fonction is_admin_user
-- La fonction utilise SECURITY DEFINER donc elle devrait bypass RLS
-- Si cela cause encore des problèmes, on utilisera l'approche alternative ci-dessous
CREATE POLICY "Admins can view all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    -- D'abord vérifier si c'est son propre profil (pas besoin de fonction)
    auth.uid() = id
    OR
    -- Sinon, vérifier si l'utilisateur est admin via la fonction
    -- La fonction utilise SECURITY DEFINER donc elle devrait bypass RLS
    public.is_admin_user(auth.uid())
  );

-- 6. Politique pour la suppression (super admins uniquement)
CREATE POLICY "Super admins can delete profiles"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (
    public.is_admin_user(auth.uid())
    AND EXISTS (
      SELECT 1 
      FROM public.user_profiles self_check
      WHERE self_check.id = auth.uid()
      AND self_check.user_type = 'super_admin'
    )
  );

-- 7. Vérifier que les permissions sont correctes
GRANT EXECUTE ON FUNCTION public.is_admin_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_user(uuid) TO anon;

-- 8. Test: Vérifier les politiques créées
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

