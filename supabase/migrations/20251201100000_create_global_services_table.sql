-- Table globale des services supplémentaires (prix fixes pour tout le monde)
BEGIN;

CREATE TABLE IF NOT EXISTS global_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  -- Prix par jour (ou par unité), en devise principale du site
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  -- Type de facturation : 'per_day', 'per_stay', etc. (pour évoluer plus tard)
  billing_type text NOT NULL DEFAULT 'per_day',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE global_services ENABLE ROW LEVEL SECURITY;

-- Lecture : tous les utilisateurs authentifiés peuvent voir la liste
CREATE POLICY "global_services_read" ON global_services
  FOR SELECT
  TO authenticated
  USING (true);

-- Écriture : seulement admin / super_admin
CREATE POLICY "global_services_write_admin" ON global_services
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND user_type IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "global_services_update_admin" ON global_services
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND user_type IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND user_type IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "global_services_delete_admin" ON global_services
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND user_type IN ('admin', 'super_admin')
    )
  );

COMMIT;




