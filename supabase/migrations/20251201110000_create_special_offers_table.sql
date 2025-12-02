-- Table pour gérer les offres spéciales / tarifs saisonniers par propriété
BEGIN;

CREATE TABLE IF NOT EXISTS special_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  title text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  special_price_per_night numeric(10,2) NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_special_offers_property_dates
  ON special_offers(property_id, start_date, end_date)
;

ALTER TABLE special_offers ENABLE ROW LEVEL SECURITY;

-- Lecture : propriétaires de la propriété + admins
CREATE POLICY "special_offers_read" ON special_offers
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

-- Insertion : propriétaire de la propriété + admins
CREATE POLICY "special_offers_insert" ON special_offers
  FOR INSERT
  TO authenticated
  WITH CHECK (
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

-- Mise à jour : propriétaire + admins
CREATE POLICY "special_offers_update" ON special_offers
  FOR UPDATE
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
  )
  WITH CHECK (
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

-- Suppression : propriétaire + admins
CREATE POLICY "special_offers_delete" ON special_offers
  FOR DELETE
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




