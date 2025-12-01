-- Script complet pour corriger le problème de création de profil utilisateur
-- À exécuter dans Supabase SQL Editor

-- 1. Supprimer TOUS les anciens triggers et fonctions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_userprofile ON auth.users;

DROP FUNCTION IF EXISTS public.handle_new_auth_user();
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_new_user_with_metadata();
DROP FUNCTION IF EXISTS public.handle_new_user_profile();

-- 2. Créer une fonction helper pour vérifier si un utilisateur est admin
-- Cette fonction utilise SECURITY DEFINER pour contourner RLS
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
  -- Essayer de récupérer le user_type directement depuis user_profiles
  -- SECURITY DEFINER permet de contourner RLS
  SELECT up.user_type INTO user_type_value
  FROM public.user_profiles up
  WHERE up.id = user_id;
  
  RETURN user_type_value IN ('admin', 'super_admin');
EXCEPTION
  WHEN OTHERS THEN
    -- En cas d'erreur, retourner false
    RETURN false;
END;
$$;

-- Donner les permissions nécessaires à la fonction
GRANT EXECUTE ON FUNCTION public.is_admin_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_user(uuid) TO anon;

-- 3. Créer une fonction propre et robuste pour le trigger
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Vérifier que l'email existe (obligatoire)
  IF NEW.email IS NULL OR NEW.email = '' THEN
    RAISE EXCEPTION 'Email is required for user profile creation';
  END IF;

  -- Insérer dans user_profiles avec gestion d'erreur
  INSERT INTO public.user_profiles (
    id,
    email,
    first_name,
    last_name,
    phone,
    user_type,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'firstName', ''), 'Utilisateur'),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'lastName', ''), ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'phone', ''), NULL),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'userType', ''), 'traveler'),
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(NULLIF(EXCLUDED.first_name, ''), user_profiles.first_name),
    last_name = COALESCE(NULLIF(EXCLUDED.last_name, ''), user_profiles.last_name),
    phone = COALESCE(EXCLUDED.phone, user_profiles.phone),
    user_type = COALESCE(NULLIF(EXCLUDED.user_type, ''), user_profiles.user_type),
    updated_at = now();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- En cas d'erreur, on log mais on ne bloque pas la création de l'utilisateur
    RAISE WARNING 'Erreur création profil pour user % (email: %): %', NEW.id, NEW.email, SQLERRM;
    RETURN NEW;
END;
$$;

-- 3. Créer le trigger
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();

-- 4. S'assurer que les permissions sont correctes
-- Supprimer TOUTES les anciennes politiques pour éviter les conflits
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Authenticated users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can delete profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON user_profiles;

-- Politique pour permettre aux utilisateurs authentifiés d'insérer leur propre profil
CREATE POLICY "Users can insert their own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Politique pour permettre aux utilisateurs de voir leur propre profil
CREATE POLICY "Users can view their own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Politique pour permettre aux admins et super_admins de voir tous les profils
-- Utilise la fonction helper pour éviter les problèmes de récursion
CREATE POLICY "Admins can view all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- Politique pour permettre aux utilisateurs authentifiés de mettre à jour leur propre profil
CREATE POLICY "Users can update their own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Politique pour permettre aux super administrateurs de supprimer des profils
CREATE POLICY "Super admins can delete profiles"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- Autoriser anon à insérer (pour le fallback côté app) - avec service_role
-- Note: Cette permission est nécessaire pour le fallback côté application
-- mais devrait être utilisée avec précaution en production
GRANT INSERT, SELECT, UPDATE, DELETE ON user_profiles TO anon;

-- 5. Activer RLS sur user_profiles si ce n'est pas déjà fait
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 6. Vérifier que la table existe et a les bonnes colonnes
DO $$
BEGIN
  -- Vérifier que la table user_profiles existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles'
  ) THEN
    RAISE EXCEPTION 'La table user_profiles n''existe pas. Veuillez créer la table d''abord.';
  END IF;
  
  -- Vérifier que la colonne email existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles'
    AND column_name = 'email'
  ) THEN
    RAISE EXCEPTION 'La colonne email n''existe pas dans user_profiles. Veuillez l''ajouter.';
  END IF;
END $$;

-- 7. Script de test pour vérifier que tout fonctionne
-- (À exécuter manuellement pour tester)

-- Test 1: Vérifier que la fonction is_admin_user existe
SELECT 
  routine_name, 
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'is_admin_user';

-- Test 2: Vérifier que le trigger existe
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created_profile';

-- Test 3: Vérifier que la fonction handle_new_user_profile existe
SELECT 
  routine_name, 
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'handle_new_user_profile';

-- Test 4: Vérifier les politiques RLS
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

-- Test 5: Tester la fonction is_admin_user (remplacez USER_ID par un ID réel)
-- SELECT public.is_admin_user('USER_ID'::uuid);

-- Test 6: Vérifier les permissions sur la fonction
SELECT 
  grantee,
  privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
AND routine_name = 'is_admin_user';

