-- Script de nettoyage rapide pour supprimer toutes les politiques sur user_profiles
-- Exécutez ce script AVANT d'exécuter FIX_RECURSION_USER_PROFILES.sql si vous avez des erreurs

-- Supprimer explicitement toutes les politiques connues
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

-- Supprimer dynamiquement toutes les autres politiques
DO $$
DECLARE
    r RECORD;
BEGIN
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
                RAISE WARNING 'Erreur lors de la suppression de la politique %: %', r.policyname, SQLERRM;
        END;
    END LOOP;
END $$;

-- Vérifier qu'il ne reste plus de politiques
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- Si cette requête retourne des résultats, il reste des politiques à supprimer manuellement

