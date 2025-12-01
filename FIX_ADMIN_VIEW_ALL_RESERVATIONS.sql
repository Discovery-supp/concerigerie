-- ============================================
-- PERMETTRE AUX ADMINS DE VOIR TOUTES LES RÉSERVATIONS
-- ============================================
-- 
-- OBJECTIF: Ajouter une politique RLS qui permet aux admins et super_admins
--           de voir TOUTES les réservations, sans modifier les politiques
--           existantes pour les Guests et Hosts
--
-- IMPORTANT: Ce script ne modifie PAS les politiques sur user_profiles
--
-- ============================================
-- INSTRUCTIONS:
-- 1. Exécutez ce script dans Supabase SQL Editor
-- 2. Les admins pourront maintenant voir toutes les réservations
-- 3. Les Guests et Hosts gardent leurs permissions existantes
-- ============================================

-- ÉTAPE 1: Vérifier l'état actuel des politiques sur reservations
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'reservations'
  AND schemaname = 'public'
ORDER BY policyname, cmd;

-- ÉTAPE 2: S'assurer que RLS est activé
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- ÉTAPE 3: Vérifier si la fonction is_admin_user existe
-- Si elle n'existe pas, on la crée
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name = 'is_admin_user'
  ) THEN
    -- Créer la fonction is_admin_user
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
      SELECT up.user_type INTO user_type_value
      FROM public.user_profiles up
      WHERE up.id = user_id;
      
      RETURN COALESCE(user_type_value IN ('admin', 'super_admin'), false);
    EXCEPTION
      WHEN OTHERS THEN
        RETURN false;
    END;
    $$;
    
    -- Donner les permissions
    GRANT EXECUTE ON FUNCTION public.is_admin_user(uuid) TO authenticated;
    GRANT EXECUTE ON FUNCTION public.is_admin_user(uuid) TO anon;
    GRANT EXECUTE ON FUNCTION public.is_admin_user(uuid) TO service_role;
  END IF;
END $$;

-- ÉTAPE 4: Supprimer l'ancienne politique admin si elle existe
DROP POLICY IF EXISTS "Admins can view all reservations" ON reservations;

-- ÉTAPE 5: Créer la politique pour les admins de voir toutes les réservations
-- Cette politique s'ajoute aux politiques existantes (elles sont permissive)
CREATE POLICY "Admins can view all reservations"
  ON reservations
  FOR SELECT
  TO authenticated
  USING (
    -- Les admins et super_admins peuvent voir toutes les réservations
    public.is_admin_user(auth.uid())
  );

-- ÉTAPE 6: Optionnel - Permettre aux admins de modifier toutes les réservations
DROP POLICY IF EXISTS "Admins can update all reservations" ON reservations;

CREATE POLICY "Admins can update all reservations"
  ON reservations
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin_user(auth.uid())
  )
  WITH CHECK (
    public.is_admin_user(auth.uid())
  );

-- ÉTAPE 7: Optionnel - Permettre aux admins de supprimer toutes les réservations
DROP POLICY IF EXISTS "Admins can delete all reservations" ON reservations;

CREATE POLICY "Admins can delete all reservations"
  ON reservations
  FOR DELETE
  TO authenticated
  USING (
    public.is_admin_user(auth.uid())
  );

-- ============================================
-- VÉRIFICATIONS
-- ============================================

-- Vérifier que toutes les politiques sont créées
SELECT 
  policyname,
  cmd,
  roles,
  qual
FROM pg_policies
WHERE tablename = 'reservations'
  AND schemaname = 'public'
ORDER BY policyname, cmd;

-- Vérifier que RLS est activé
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'reservations';

-- ============================================
-- NOTES IMPORTANTES:
-- ============================================
-- 1. Les politiques RLS sont "permissive" par défaut, ce qui signifie que
--    si UNE politique autorise l'accès, l'utilisateur peut accéder aux données
--
-- 2. Les politiques existantes pour Guests et Hosts continuent de fonctionner:
--    - Les Guests peuvent voir leurs propres réservations
--    - Les Hosts peuvent voir les réservations de leurs propriétés
--    - Les Admins peuvent maintenant voir TOUTES les réservations
--
-- 3. Si vous obtenez une erreur de récursion avec is_admin_user(), utilisez
--    la solution alternative ci-dessous qui vérifie directement le user_type
--
-- 4. Ce script ne modifie PAS les politiques sur user_profiles

-- ============================================
-- SOLUTION ALTERNATIVE (si is_admin_user cause des problèmes)
-- ============================================
-- Si is_admin_user() cause des problèmes de récursion, utilisez cette version:

/*
-- Supprimer la politique qui utilise is_admin_user
DROP POLICY IF EXISTS "Admins can view all reservations" ON reservations;

-- Créer une politique qui vérifie directement le user_type
CREATE POLICY "Admins can view all reservations"
  ON reservations
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
*/

-- ============================================
-- FIN DU SCRIPT
-- ============================================

