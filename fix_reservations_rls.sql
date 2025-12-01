-- ============================================
-- CONFIGURATION DES POLITIQUES RLS POUR RESERVATIONS
-- ============================================
-- 
-- OBJECTIF: Permettre aux Guests de voir leurs propres réservations
--           et aux Hosts (propriétaires) de voir les réservations de leurs propriétés
--
-- ============================================
-- INSTRUCTIONS:
-- 1. Copiez ce script dans Supabase SQL Editor
-- 2. Exécutez-le complètement
-- 3. Testez en vous connectant en tant que Guest et Host
-- ============================================

-- ÉTAPE 1: Activer RLS sur la table reservations
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- ÉTAPE 2: Supprimer toutes les politiques existantes pour éviter les conflits
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Supprimer toutes les politiques existantes sur reservations
    FOR r IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'reservations'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON reservations', r.policyname);
    END LOOP;
END $$;

-- Supprimer aussi explicitement les politiques connues
DROP POLICY IF EXISTS "Users can view their reservations" ON reservations;
DROP POLICY IF EXISTS "Users can read their reservations" ON reservations;
DROP POLICY IF EXISTS "Guests can create reservations" ON reservations;
DROP POLICY IF EXISTS "Authenticated users can create reservations" ON reservations;
DROP POLICY IF EXISTS "Users can update their reservations" ON reservations;
DROP POLICY IF EXISTS "Owners and guests can update reservations" ON reservations;
DROP POLICY IF EXISTS "Guests can update their reservations" ON reservations;
DROP POLICY IF EXISTS "Hosts can view their property reservations" ON reservations;

-- ============================================
-- ÉTAPE 3: Créer les politiques RLS
-- ============================================

-- Politique 1: SELECT - Les Guests peuvent voir leurs propres réservations
--              Les Hosts peuvent voir les réservations de leurs propriétés
CREATE POLICY "Guests and Hosts can view reservations"
  ON reservations
  FOR SELECT
  TO authenticated
  USING (
    -- Les Guests peuvent voir leurs propres réservations
    guest_id = auth.uid()
    OR
    -- Les Hosts (propriétaires) peuvent voir les réservations de leurs propriétés
    EXISTS (
      SELECT 1 
      FROM properties 
      WHERE properties.id = reservations.property_id 
      AND properties.owner_id = auth.uid()
    )
  );

-- Politique 2: INSERT - Seuls les Guests authentifiés peuvent créer des réservations
--              et ils ne peuvent créer que pour eux-mêmes
CREATE POLICY "Guests can create reservations"
  ON reservations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Vérifier que le guest_id correspond à l'utilisateur connecté
    guest_id = auth.uid()
    AND
    -- Vérifier que la propriété existe et est publiée
    EXISTS (
      SELECT 1 
      FROM properties 
      WHERE properties.id = reservations.property_id 
      AND properties.is_published = true
    )
  );

-- Politique 3: UPDATE - Les Guests peuvent mettre à jour leurs propres réservations
--              Les Hosts peuvent mettre à jour les réservations de leurs propriétés
CREATE POLICY "Guests and Hosts can update reservations"
  ON reservations
  FOR UPDATE
  TO authenticated
  USING (
    -- Les Guests peuvent mettre à jour leurs propres réservations
    guest_id = auth.uid()
    OR
    -- Les Hosts peuvent mettre à jour les réservations de leurs propriétés
    EXISTS (
      SELECT 1 
      FROM properties 
      WHERE properties.id = reservations.property_id 
      AND properties.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Même logique pour WITH CHECK
    guest_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 
      FROM properties 
      WHERE properties.id = reservations.property_id 
      AND properties.owner_id = auth.uid()
    )
  );

-- Politique 4: DELETE - Les Guests peuvent supprimer leurs propres réservations
--              Les Hosts peuvent supprimer les réservations de leurs propriétés
--              (seulement si le statut le permet)
CREATE POLICY "Guests and Hosts can delete reservations"
  ON reservations
  FOR DELETE
  TO authenticated
  USING (
    -- Les Guests peuvent supprimer leurs propres réservations
    (guest_id = auth.uid() AND status IN ('pending', 'cancelled'))
    OR
    -- Les Hosts peuvent supprimer les réservations de leurs propriétés
    (EXISTS (
      SELECT 1 
      FROM properties 
      WHERE properties.id = reservations.property_id 
      AND properties.owner_id = auth.uid()
    ) AND status IN ('pending', 'cancelled'))
  );

-- ============================================
-- VÉRIFICATIONS
-- ============================================

-- Vérifier que RLS est activé
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'reservations';

-- Vérifier que les politiques ont été créées
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
WHERE tablename = 'reservations'
ORDER BY policyname, cmd;

-- ============================================
-- NOTES IMPORTANTES:
-- ============================================
-- 1. Les Guests (voyageurs) peuvent:
--    - Voir leurs propres réservations (guest_id = auth.uid())
--    - Créer des réservations pour eux-mêmes
--    - Mettre à jour leurs propres réservations
--    - Supprimer leurs propres réservations (si pending ou cancelled)
--
-- 2. Les Hosts (propriétaires) peuvent:
--    - Voir les réservations de leurs propriétés (property.owner_id = auth.uid())
--    - Mettre à jour les réservations de leurs propriétés
--    - Supprimer les réservations de leurs propriétés (si pending ou cancelled)
--
-- 3. Les admins peuvent avoir besoin de politiques supplémentaires
--    si vous voulez qu'ils voient toutes les réservations

-- ============================================
-- FIN DU SCRIPT
-- ============================================
