-- Ajoute des colonnes pour les préférences d'alerte et les prestataires favoris des hôtes
BEGIN;

ALTER TABLE host_profiles
ADD COLUMN IF NOT EXISTS alert_preferences jsonb NOT NULL DEFAULT
  jsonb_build_object(
    'booking', true,
    'payments', true,
    'reviews', true,
    'newsletter', false
  );

ALTER TABLE host_profiles
ADD COLUMN IF NOT EXISTS preferred_provider_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[];

COMMIT;







