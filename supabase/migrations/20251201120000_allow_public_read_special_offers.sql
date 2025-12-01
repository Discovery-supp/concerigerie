-- Permettre la lecture publique des offres spéciales actives
-- (nécessaire pour que les voyageurs voient les prix spéciaux lors de la réservation)
BEGIN;

-- Supprimer les anciennes politiques restrictives
DROP POLICY IF EXISTS "special_offers_read" ON special_offers;
DROP POLICY IF EXISTS "special_offers_read_public" ON special_offers;
DROP POLICY IF EXISTS "special_offers_read_owner_admin" ON special_offers;

-- Nouvelle politique : lecture pour tous (authentifiés et non authentifiés)
-- mais seulement pour les offres actives
CREATE POLICY "special_offers_read_public" ON special_offers
  FOR SELECT
  TO public
  USING (is_active = true);

-- Politique pour les propriétaires/admins : peuvent lire toutes les offres (actives ou non)
CREATE POLICY "special_offers_read_owner_admin" ON special_offers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = special_offers.property_id
      AND properties.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND user_type IN ('admin', 'super_admin')
    )
  );

COMMIT;

