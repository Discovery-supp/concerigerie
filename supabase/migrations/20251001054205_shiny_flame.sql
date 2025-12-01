/*
  # Correction de la colonne guest_id manquante

  1. Modifications
    - Ajouter la colonne guest_id à la table reviews si elle n'existe pas
    - Mettre à jour les politiques RLS pour inclure guest_id
    - Corriger les index et contraintes

  2. Sécurité
    - Maintenir RLS activé
    - Politiques d'accès appropriées
*/

-- Ajouter la colonne guest_id à la table reviews si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reviews' AND column_name = 'guest_id'
  ) THEN
    ALTER TABLE reviews ADD COLUMN guest_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Supprimer les anciennes politiques RLS pour reviews
DROP POLICY IF EXISTS "Anyone can read reviews" ON reviews;
DROP POLICY IF EXISTS "Guests can create reviews for their reservations" ON reviews;

-- Recréer les politiques RLS avec guest_id
CREATE POLICY "Anyone can read reviews" ON reviews
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Guests can create reviews for their reservations" ON reviews
  FOR INSERT TO authenticated
  WITH CHECK (guest_id = auth.uid());

-- Ajouter l'index pour guest_id si il n'existe pas
CREATE INDEX IF NOT EXISTS idx_reviews_guest_id ON reviews(guest_id);

-- Mettre à jour les données existantes si nécessaire
-- (Optionnel: vous pouvez remplir guest_id depuis reservation_id si des données existent)
UPDATE reviews 
SET guest_id = (
  SELECT guest_id 
  FROM reservations 
  WHERE reservations.id = reviews.reservation_id
)
WHERE guest_id IS NULL AND reservation_id IS NOT NULL;