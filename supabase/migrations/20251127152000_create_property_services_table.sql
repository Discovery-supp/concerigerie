-- Table pour gérer les services supplémentaires par propriété
BEGIN;

CREATE TABLE IF NOT EXISTS property_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  default_quantity integer NOT NULL DEFAULT 1,
  is_mandatory boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_property_services_property_id ON property_services(property_id);

ALTER TABLE property_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "property_services_read" ON property_services
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = property_id
    OR auth.uid() IN (SELECT owner_id FROM properties WHERE id = property_id)
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND user_type IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "property_services_write_owner" ON property_services
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_id
      AND properties.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND user_type IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "property_services_update_owner" ON property_services
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_id
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
      WHERE properties.id = property_id
      AND properties.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND user_type IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "property_services_delete_owner" ON property_services
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_id
      AND properties.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND user_type IN ('admin', 'super_admin')
    )
  );

COMMIT;





