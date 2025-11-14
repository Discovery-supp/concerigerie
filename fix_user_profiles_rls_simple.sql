-- Solution SIMPLE et SÛRE pour corriger la récursion infinie
-- Cette approche évite complètement d'utiliser is_admin_user() dans les politiques RLS
-- qui causent la récursion

-- ============================================
-- ÉTAPE 1: Supprimer toutes les politiques problématiques
-- ============================================
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can delete profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;

-- ============================================
-- ÉTAPE 2: Recréer les politiques de base
-- (sans vérification admin qui cause la récursion)
-- ============================================

-- Politique 1: Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view their own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Politique 2: Les utilisateurs peuvent voir les profils publics
-- (par exemple, pour voir les propriétaires des propriétés)
-- Cette politique permet de voir les profils liés aux propriétés publiées
CREATE POLICY "Users can view profiles linked to properties"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Permettre de voir les profils des propriétaires de propriétés publiées
    EXISTS (
      SELECT 1 
      FROM properties p
      WHERE p.owner_id = user_profiles.id
      AND p.is_published = true
    )
    OR
    -- Permettre de voir les profils liés aux réservations de l'utilisateur
    EXISTS (
      SELECT 1 
      FROM reservations r
      WHERE (r.guest_id = auth.uid() AND r.property_id IN (
        SELECT p.id FROM properties p WHERE p.owner_id = user_profiles.id
      ))
    )
  );

-- Politique 3: Les utilisateurs peuvent mettre à jour leur propre profil
CREATE POLICY "Users can update their own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Politique 4: Les utilisateurs peuvent insérer leur propre profil
CREATE POLICY "Users can insert their own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ============================================
-- ÉTAPE 3: Pour les fonctionnalités admin
-- ============================================
-- NOTE: Pour les fonctionnalités qui nécessitent des droits admin,
-- il est recommandé de:
-- 1. Vérifier le statut admin côté application (dans le code TypeScript/JavaScript)
-- 2. Utiliser le service_role key pour les opérations admin côté serveur
-- 3. Ou créer une table séparée pour les rôles qui n'a pas RLS

-- Si vous avez absolument besoin d'une politique RLS pour les admins,
-- vous pouvez créer une table séparée pour les rôles:
/*
CREATE TABLE IF NOT EXISTS user_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'super_admin')),
  created_at timestamptz DEFAULT now()
);

-- Désactiver RLS sur cette table (ou créer des politiques très simples)
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own role" ON user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Ensuite, créer une fonction qui vérifie cette table au lieu de user_profiles
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  role_value text;
BEGIN
  SELECT ur.role INTO role_value
  FROM user_roles ur
  WHERE ur.user_id = user_id;
  
  RETURN COALESCE(role_value IN ('admin', 'super_admin'), false);
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;
*/

-- ============================================
-- ÉTAPE 4: Vérifications
-- ============================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- ============================================
-- NOTES IMPORTANTES:
-- ============================================
-- Cette solution évite complètement la récursion en ne vérifiant pas
-- le statut admin dans les politiques RLS.
--
-- Pour les fonctionnalités admin:
-- - Vérifiez le statut admin dans votre code applicatif (TypeScript)
-- - Utilisez le service_role key pour les opérations admin côté serveur
-- - Ou implémentez la solution avec user_roles table (commentée ci-dessus)

