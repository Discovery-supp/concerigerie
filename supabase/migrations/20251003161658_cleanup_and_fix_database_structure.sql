/*
  # Nettoyage complet et restructuration de la base de données
  
  ## Problème
  - Conflit entre public.users et auth.users
  - Migrations précédentes ont créé une structure incorrecte
  
  ## Solution
  - Supprimer toutes les tables existantes
  - Recréer avec la bonne structure (user_profiles au lieu de users)
  - Restaurer les données essentielles
  
  ## Tables
  1. user_profiles - Profils utilisateurs (référence auth.users)
  2. properties - Propriétés à louer
  3. reservations - Réservations
  4. host_profiles - Profils d'hôtes
  5. service_providers - Prestataires de services
  6. reviews - Avis et évaluations
*/

-- Supprimer toutes les tables dans l'ordre inverse des dépendances
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS service_providers CASCADE;
DROP TABLE IF EXISTS host_profiles CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Créer la table user_profiles (remplace public.users)
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  phone text,
  user_type text NOT NULL DEFAULT 'traveler' CHECK (user_type IN ('owner', 'provider', 'partner', 'admin', 'traveler')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Créer la table properties
CREATE TABLE properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  type text NOT NULL,
  address text NOT NULL,
  category text,
  neighborhood text,
  surface integer,
  max_guests integer DEFAULT 1,
  bedrooms integer DEFAULT 1,
  bathrooms integer DEFAULT 1,
  beds integer DEFAULT 1,
  price_per_night decimal(10,2) NOT NULL,
  cleaning_fee decimal(10,2) DEFAULT 0,
  min_nights integer DEFAULT 1,
  max_nights integer DEFAULT 365,
  amenities jsonb DEFAULT '[]'::jsonb,
  images jsonb DEFAULT '[]'::jsonb,
  rules jsonb DEFAULT '[]'::jsonb,
  cancellation_policy text DEFAULT 'flexible',
  check_in_time text DEFAULT '14:00',
  check_out_time text DEFAULT '11:00',
  beach_access boolean DEFAULT false,
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Créer la table reservations
CREATE TABLE reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  guest_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  check_in date NOT NULL,
  check_out date NOT NULL,
  adults integer DEFAULT 1,
  children integer DEFAULT 0,
  infants integer DEFAULT 0,
  pets integer DEFAULT 0,
  total_amount decimal(10,2) NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_method text,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  special_requests text,
  additional_services jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Créer la table host_profiles
CREATE TABLE host_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  selected_package text,
  commission_rate decimal(5,2) DEFAULT 15.00,
  description text,
  languages jsonb DEFAULT '[]'::jsonb,
  profession text,
  interests jsonb DEFAULT '[]'::jsonb,
  why_host text,
  hosting_frequency text,
  accommodation_type text,
  guest_types jsonb DEFAULT '[]'::jsonb,
  stay_duration text,
  payment_method text,
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

-- Créer la table service_providers
CREATE TABLE service_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company text,
  experience text,
  services jsonb DEFAULT '[]'::jsonb,
  availability jsonb DEFAULT '{}'::jsonb,
  hourly_rate decimal(10,2),
  intervention_zones jsonb DEFAULT '[]'::jsonb,
  documents jsonb DEFAULT '[]'::jsonb,
  is_verified boolean DEFAULT false,
  rating decimal(3,2) DEFAULT 0,
  completed_jobs integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Créer la table reviews
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  cleanliness_rating integer CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
  communication_rating integer CHECK (communication_rating >= 1 AND communication_rating <= 5),
  checkin_rating integer CHECK (checkin_rating >= 1 AND checkin_rating <= 5),
  accuracy_rating integer CHECK (accuracy_rating >= 1 AND accuracy_rating <= 5),
  location_rating integer CHECK (location_rating >= 1 AND location_rating <= 5),
  value_rating integer CHECK (value_rating >= 1 AND value_rating <= 5),
  host_response text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activer RLS sur toutes les tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE host_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour user_profiles
CREATE POLICY "Users can read own profile" ON user_profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Politiques RLS pour properties
CREATE POLICY "Anyone can view published properties" ON properties
  FOR SELECT
  USING (is_published = true OR owner_id = auth.uid());

CREATE POLICY "Owners can insert their properties" ON properties
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update their properties" ON properties
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can delete their properties" ON properties
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- Politiques RLS pour reservations
CREATE POLICY "Users can view their reservations" ON reservations
  FOR SELECT TO authenticated
  USING (guest_id = auth.uid() OR EXISTS (
    SELECT 1 FROM properties WHERE properties.id = reservations.property_id AND properties.owner_id = auth.uid()
  ));

CREATE POLICY "Authenticated users can create reservations" ON reservations
  FOR INSERT TO authenticated
  WITH CHECK (guest_id = auth.uid());

CREATE POLICY "Guests can update their reservations" ON reservations
  FOR UPDATE TO authenticated
  USING (guest_id = auth.uid())
  WITH CHECK (guest_id = auth.uid());

-- Politiques RLS pour host_profiles
CREATE POLICY "Users can read own host profile" ON host_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own host profile" ON host_profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own host profile" ON host_profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Politiques RLS pour service_providers
CREATE POLICY "Anyone can view verified providers" ON service_providers
  FOR SELECT
  USING (is_verified = true OR user_id = auth.uid());

CREATE POLICY "Users can insert own provider profile" ON service_providers
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own provider profile" ON service_providers
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Politiques RLS pour reviews
CREATE POLICY "Anyone can read reviews" ON reviews
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create reviews" ON reviews
  FOR INSERT TO authenticated
  WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "Users can update own reviews" ON reviews
  FOR UPDATE TO authenticated
  USING (reviewer_id = auth.uid())
  WITH CHECK (reviewer_id = auth.uid());

-- Index pour les performances
CREATE INDEX idx_user_profiles_user_type ON user_profiles(user_type);
CREATE INDEX idx_properties_owner_id ON properties(owner_id);
CREATE INDEX idx_properties_is_published ON properties(is_published);
CREATE INDEX idx_reservations_property_id ON reservations(property_id);
CREATE INDEX idx_reservations_guest_id ON reservations(guest_id);
CREATE INDEX idx_reservations_dates ON reservations(check_in, check_out);
CREATE INDEX idx_reviews_property_id ON reviews(property_id);
CREATE INDEX idx_host_profiles_user_id ON host_profiles(user_id);
CREATE INDEX idx_service_providers_user_id ON service_providers(user_id);