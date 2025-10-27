/*
  # Création du schéma complet pour Nzoo Immo Conciergerie

  1. Tables principales
    - `users` - Utilisateurs (propriétaires, voyageurs, partenaires, prestataires)
    - `properties` - Propriétés/annonces
    - `reservations` - Réservations
    - `service_providers` - Prestataires de services
    - `host_profiles` - Profils des hôtes
    - `reviews` - Avis et commentaires

  2. Sécurité
    - RLS activé sur toutes les tables
    - Politiques d'accès appropriées
    - Authentification requise

  3. Fonctionnalités
    - Support multi-devises
    - Gestion des forfaits et commissions
    - Système de réservation complet
    - Profils détaillés
*/

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  user_type text NOT NULL CHECK (user_type IN ('owner', 'traveler', 'partner', 'provider', 'admin')),
  profile_image text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des propriétés
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  type text NOT NULL,
  address text NOT NULL,
  surface integer DEFAULT 0,
  max_guests integer NOT NULL DEFAULT 1,
  bedrooms integer NOT NULL DEFAULT 0,
  bathrooms integer NOT NULL DEFAULT 1,
  beds integer NOT NULL DEFAULT 1,
  price_per_night decimal(10,2) NOT NULL DEFAULT 0,
  cleaning_fee decimal(10,2) DEFAULT 0,
  min_nights integer DEFAULT 1,
  max_nights integer DEFAULT 30,
  amenities text[] DEFAULT '{}',
  images text[] DEFAULT '{}',
  rules text[] DEFAULT '{}',
  cancellation_policy text DEFAULT 'flexible',
  check_in_time time DEFAULT '15:00',
  check_out_time time DEFAULT '11:00',
  category text DEFAULT 'Standard',
  neighborhood text,
  beach_access boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des réservations
CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  guest_id uuid REFERENCES users(id) ON DELETE CASCADE,
  check_in date NOT NULL,
  check_out date NOT NULL,
  adults integer NOT NULL DEFAULT 1,
  children integer DEFAULT 0,
  infants integer DEFAULT 0,
  pets integer DEFAULT 0,
  total_amount decimal(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_method text NOT NULL,
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  special_requests text,
  additional_services text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des prestataires de services
CREATE TABLE IF NOT EXISTS service_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  company text,
  experience text NOT NULL,
  services text[] NOT NULL DEFAULT '{}',
  availability jsonb DEFAULT '{}',
  hourly_rate decimal(10,2) NOT NULL DEFAULT 0,
  intervention_zones text[] DEFAULT '{}',
  documents text[] DEFAULT '{}',
  is_verified boolean DEFAULT false,
  rating decimal(3,2) DEFAULT 0,
  completed_jobs integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des profils hôtes
CREATE TABLE IF NOT EXISTS host_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  selected_package text NOT NULL,
  commission_rate integer NOT NULL DEFAULT 15,
  description text,
  languages text[] DEFAULT '{}',
  profession text,
  interests text[] DEFAULT '{}',
  why_host text,
  hosting_frequency text,
  accommodation_type text,
  guest_types text[] DEFAULT '{}',
  stay_duration text,
  payment_method text NOT NULL,
  bank_account text,
  bank_name text,
  bank_country text,
  mobile_number text,
  mobile_name text,
  mobile_city text,
  mobile_network text,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des avis
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid REFERENCES reservations(id) ON DELETE CASCADE,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  guest_id uuid REFERENCES users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Activation de RLS sur toutes les tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE host_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour users
CREATE POLICY "Users can read own data" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Anyone can insert users" ON users
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Politiques RLS pour properties
CREATE POLICY "Anyone can read active properties" ON properties
  FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Owners can manage their properties" ON properties
  FOR ALL TO authenticated
  USING (owner_id = auth.uid());

-- Politiques RLS pour reservations
CREATE POLICY "Users can read their reservations" ON reservations
  FOR SELECT TO authenticated
  USING (guest_id = auth.uid() OR EXISTS (
    SELECT 1 FROM properties WHERE id = property_id AND owner_id = auth.uid()
  ));

CREATE POLICY "Guests can create reservations" ON reservations
  FOR INSERT TO authenticated
  WITH CHECK (guest_id = auth.uid());

CREATE POLICY "Users can update their reservations" ON reservations
  FOR UPDATE TO authenticated
  USING (guest_id = auth.uid() OR EXISTS (
    SELECT 1 FROM properties WHERE id = property_id AND owner_id = auth.uid()
  ));

-- Politiques RLS pour service_providers
CREATE POLICY "Anyone can read verified providers" ON service_providers
  FOR SELECT TO authenticated
  USING (is_verified = true);

CREATE POLICY "Providers can manage their profile" ON service_providers
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- Politiques RLS pour host_profiles
CREATE POLICY "Hosts can manage their profile" ON host_profiles
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- Politiques RLS pour reviews
CREATE POLICY "Anyone can read reviews" ON reviews
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Guests can create reviews for their reservations" ON reviews
  FOR INSERT TO authenticated
  WITH CHECK (guest_id = auth.uid());

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_is_active ON properties(is_active);
CREATE INDEX IF NOT EXISTS idx_reservations_property_id ON reservations(property_id);
CREATE INDEX IF NOT EXISTS idx_reservations_guest_id ON reservations(guest_id);
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_reviews_property_id ON reviews(property_id);
CREATE INDEX IF NOT EXISTS idx_service_providers_user_id ON service_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_host_profiles_user_id ON host_profiles(user_id);

-- Fonctions pour mise à jour automatique des timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour mise à jour automatique
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_providers_updated_at BEFORE UPDATE ON service_providers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_host_profiles_updated_at BEFORE UPDATE ON host_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();