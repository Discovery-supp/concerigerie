/*
  # Correction finale de la table users
  
  ## Changements
  - Suppression de public.users
  - Création de user_profiles pour les métadonnées
  - Mise à jour des références vers auth.users
  - Création d'un trigger automatique pour les nouveaux utilisateurs
*/

-- Supprimer les contraintes existantes
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_owner_id_fkey;
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_guest_id_fkey;
ALTER TABLE host_profiles DROP CONSTRAINT IF EXISTS host_profiles_user_id_fkey;
ALTER TABLE service_providers DROP CONSTRAINT IF EXISTS service_providers_user_id_fkey;
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_reviewer_id_fkey;

-- Créer la table user_profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  phone text,
  user_type text NOT NULL DEFAULT 'traveler' CHECK (user_type IN ('owner', 'provider', 'partner', 'admin', 'traveler')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Migrer les données si la table public.users existe
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    INSERT INTO user_profiles (id, first_name, last_name, phone, user_type, created_at)
    SELECT id, first_name, last_name, phone, user_type, created_at 
    FROM public.users
    WHERE id IN (SELECT id FROM auth.users)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Supprimer public.users
DROP TABLE IF EXISTS public.users CASCADE;

-- Recréer les contraintes
ALTER TABLE properties 
  ADD CONSTRAINT properties_owner_id_fkey 
  FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE reservations 
  ADD CONSTRAINT reservations_guest_id_fkey 
  FOREIGN KEY (guest_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE host_profiles 
  ADD CONSTRAINT host_profiles_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE service_providers 
  ADD CONSTRAINT service_providers_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE reviews 
  ADD CONSTRAINT reviews_reviewer_id_fkey 
  FOREIGN KEY (reviewer_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Activer RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
CREATE POLICY "Users can read own profile" ON user_profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Index
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_type ON user_profiles(user_type);

-- Fonction trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, user_type)
  VALUES (new.id, 'traveler');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();