-- ============================================
-- CORRECTION DES POLITIQUES RLS POUR UPDATE RESERVATIONS
-- ============================================
-- 
-- PROBLÈME: Les propriétaires ne peuvent pas mettre à jour les réservations
--           de leurs propriétés à cause des politiques RLS manquantes ou incorrectes
--
-- SOLUTION: Créer/mettre à jour les politiques pour permettre aux propriétaires
--           et aux admins de mettre à jour les réservations
-- ============================================

-- 1. Supprimer TOUTES les anciennes politiques UPDATE pour éviter les conflits
--    (même celles qui pourraient avoir des noms légèrement différents)
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Supprimer toutes les politiques UPDATE existantes sur reservations
    FOR r IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'reservations' 
        AND cmd = 'UPDATE'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON reservations', r.policyname);
    END LOOP;
END $$;

-- Supprimer aussi explicitement les politiques connues (au cas où)
DROP POLICY IF EXISTS "Owners and guests can update reservations" ON reservations;
DROP POLICY IF EXISTS "Guests and Hosts can update reservations" ON reservations;
DROP POLICY IF EXISTS "Guests can update their reservations" ON reservations;
DROP POLICY IF EXISTS "Guests can update their own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can update their reservations" ON reservations;
DROP POLICY IF EXISTS "Admins can update all reservations" ON reservations;
DROP POLICY IF EXISTS "Owners can update their property reservations" ON reservations;

-- 2. Créer la politique pour les propriétaires (owners/hosts)
--    Les propriétaires peuvent mettre à jour les réservations de leurs propriétés
CREATE POLICY "Owners can update their property reservations"
  ON reservations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM properties 
      WHERE properties.id = reservations.property_id 
      AND properties.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM properties 
      WHERE properties.id = reservations.property_id 
      AND properties.owner_id = auth.uid()
    )
  );

-- 3. Créer la politique pour les guests
--    Les guests peuvent mettre à jour leurs propres réservations
CREATE POLICY "Guests can update their own reservations"
  ON reservations
  FOR UPDATE
  TO authenticated
  USING (
    guest_id = auth.uid()
  )
  WITH CHECK (
    guest_id = auth.uid()
  );

-- 4. Créer la politique pour les admins
--    Les admins peuvent mettre à jour toutes les réservations
CREATE POLICY "Admins can update all reservations"
  ON reservations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.user_type IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.user_type IN ('admin', 'super_admin')
    )
  );

-- 5. Vérifier que RLS est activé
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- 6. Afficher les politiques créées
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING: ' || qual::text
    ELSE 'Pas de condition USING'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check::text
    ELSE 'Pas de condition WITH CHECK'
  END as with_check_clause
FROM pg_policies
WHERE tablename = 'reservations'
  AND cmd = 'UPDATE'
ORDER BY policyname;

