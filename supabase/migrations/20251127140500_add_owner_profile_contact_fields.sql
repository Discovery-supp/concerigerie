-- Ajoute des champs d'informations complémentaires sur les profils utilisateurs
BEGIN;

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS avatar_url text;

COMMIT;







