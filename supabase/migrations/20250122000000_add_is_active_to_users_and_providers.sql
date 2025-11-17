-- Ajouter is_active à user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Ajouter is_active à service_providers
ALTER TABLE service_providers 
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Ajouter is_active à host_profiles
ALTER TABLE host_profiles 
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON user_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_service_providers_is_active ON service_providers(is_active);
CREATE INDEX IF NOT EXISTS idx_host_profiles_is_active ON host_profiles(is_active);

-- Mettre à jour les politiques RLS pour tenir compte de is_active
-- Les prestataires inactifs ne doivent pas être visibles publiquement
DROP POLICY IF EXISTS "Anyone can view active service providers" ON service_providers;
CREATE POLICY "Anyone can view active service providers" ON service_providers
  FOR SELECT
  USING (is_active = true AND is_verified = true);

-- Créer une fonction pour vérifier si l'utilisateur est admin (évite la référence circulaire)
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND user_type IN ('admin', 'super_admin')
  );
$$;

-- Ajouter une politique RLS pour permettre aux admins de lire tous les profils utilisateurs
DROP POLICY IF EXISTS "Admins can read all user profiles" ON user_profiles;
CREATE POLICY "Admins can read all user profiles" ON user_profiles
  FOR SELECT TO authenticated
  USING (public.is_admin_user() OR auth.uid() = id);

