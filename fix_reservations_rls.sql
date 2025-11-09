-- Script SQL pour corriger les politiques RLS de la table reservations
-- À exécuter dans l'éditeur SQL de Supabase

-- Activer RLS sur la table reservations si ce n'est pas déjà fait
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques s'elles existent (pour éviter les conflits)
DROP POLICY IF EXISTS "Users can read their reservations" ON reservations;
DROP POLICY IF EXISTS "Guests can create reservations" ON reservations;
DROP POLICY IF EXISTS "Authenticated users can create reservations" ON reservations;
DROP POLICY IF EXISTS "Users can update their reservations" ON reservations;
DROP POLICY IF EXISTS "Owners and guests can update reservations" ON reservations;
DROP POLICY IF EXISTS "Guests can update their reservations" ON reservations;

-- Politique pour permettre aux utilisateurs de voir leurs propres réservations
-- et aux propriétaires de voir les réservations de leurs propriétés
CREATE POLICY "Users can view their reservations" ON reservations
  FOR SELECT TO authenticated
  USING (
    guest_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = reservations.property_id 
      AND properties.owner_id = auth.uid()
    )
  );

-- Politique pour permettre aux utilisateurs authentifiés de créer des réservations
-- IMPORTANT: Cette politique vérifie que guest_id correspond à l'utilisateur connecté
CREATE POLICY "Authenticated users can create reservations" ON reservations
  FOR INSERT TO authenticated
  WITH CHECK (guest_id = auth.uid());

-- Politique pour permettre aux utilisateurs de mettre à jour leurs réservations
-- Les guests peuvent mettre à jour leurs propres réservations
-- Les propriétaires peuvent mettre à jour les réservations de leurs propriétés
CREATE POLICY "Users can update their reservations" ON reservations
  FOR UPDATE TO authenticated
  USING (
    guest_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = reservations.property_id 
      AND properties.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    guest_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = reservations.property_id 
      AND properties.owner_id = auth.uid()
    )
  );

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
ORDER BY policyname;

