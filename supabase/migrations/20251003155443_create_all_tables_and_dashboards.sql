/*
  # Création complète des tables pour Nzoo Immo Conciergerie
  
  ## Tables créées
  
  ### 1. users (déjà existe - vérification)
  Table principale pour tous les utilisateurs du système
  - `id` (uuid, PK) - ID utilisateur Supabase Auth
  - `email` (text) - Email unique
  - `first_name` (text) - Prénom
  - `last_name` (text) - Nom
  - `phone` (text) - Téléphone
  - `user_type` (text) - Type: owner, provider, partner, admin, traveler
  - `created_at` (timestamptz) - Date de création
  
  ### 2. properties
  Table des propriétés/logements à louer
  - `id` (uuid, PK)
  - `owner_id` (uuid, FK → users) - Propriétaire
  - `title` (text) - Titre de l'annonce
  - `description` (text) - Description
  - `type` (text) - Type de propriété
  - `address` (text) - Adresse complète
  - `category` (text) - Catégorie
  - `neighborhood` (text) - Quartier
  - `surface` (integer) - Surface en m²
  - `max_guests` (integer) - Nombre max de voyageurs
  - `bedrooms` (integer) - Nombre de chambres
  - `bathrooms` (integer) - Nombre de salles de bain
  - `beds` (integer) - Nombre de lits
  - `price_per_night` (decimal) - Prix par nuit
  - `cleaning_fee` (decimal) - Frais de ménage
  - `min_nights` (integer) - Séjour minimum
  - `max_nights` (integer) - Séjour maximum
  - `amenities` (jsonb) - Équipements
  - `images` (jsonb) - Photos
  - `rules` (jsonb) - Règles
  - `cancellation_policy` (text) - Politique d'annulation
  - `check_in_time` (text) - Heure d'arrivée
  - `check_out_time` (text) - Heure de départ
  - `beach_access` (boolean) - Accès plage
  - `is_published` (boolean) - Publié ou non
  
  ### 3. reservations
  Table des réservations
  - `id` (uuid, PK)
  - `property_id` (uuid, FK → properties)
  - `guest_id` (uuid, FK → users)
  - `check_in` (date) - Date d'arrivée
  - `check_out` (date) - Date de départ
  - `adults` (integer) - Nombre d'adultes
  - `children` (integer) - Nombre d'enfants
  - `infants` (integer) - Nombre de nourrissons
  - `pets` (integer) - Nombre d'animaux
  - `total_amount` (decimal) - Montant total
  - `status` (text) - pending, confirmed, cancelled, completed
  - `payment_method` (text) - Mode de paiement
  - `payment_status` (text) - pending, paid, refunded
  - `special_requests` (text) - Demandes spéciales
  - `additional_services` (jsonb) - Services additionnels
  
  ### 4. host_profiles
  Table des profils d'hôtes/propriétaires
  - `id` (uuid, PK)
  - `user_id` (uuid, FK → users)
  - `selected_package` (text) - Package choisi
  - `commission_rate` (decimal) - Taux de commission
  - `description` (text) - Présentation
  - `languages` (jsonb) - Langues parlées
  - `profession` (text) - Profession
  - `interests` (jsonb) - Centres d'intérêt
  - `why_host` (text) - Motivation
  - `hosting_frequency` (text) - Fréquence d'hébergement
  - `accommodation_type` (text) - Type d'hébergement
  - `guest_types` (jsonb) - Types de voyageurs acceptés
  - `stay_duration` (text) - Durée de séjour préférée
  - `payment_method` (text) - Mode de paiement préféré
  - `bank_account` (text) - Compte bancaire
  - `bank_name` (text) - Nom de la banque
  - `bank_country` (text) - Pays de la banque
  - `mobile_number` (text) - Numéro mobile money
  - `mobile_name` (text) - Nom titulaire mobile money
  - `mobile_city` (text) - Ville mobile money
  - `mobile_network` (text) - Réseau mobile money
  - `is_verified` (boolean) - Vérifié ou non
  
  ### 5. service_providers
  Table des prestataires de services
  - `id` (uuid, PK)
  - `user_id` (uuid, FK → users)
  - `company` (text) - Nom de l'entreprise
  - `experience` (text) - Années d'expérience
  - `services` (jsonb) - Services proposés
  - `availability` (jsonb) - Disponibilités
  - `hourly_rate` (decimal) - Tarif horaire
  - `intervention_zones` (jsonb) - Zones d'intervention
  - `documents` (jsonb) - Documents
  - `is_verified` (boolean) - Vérifié ou non
  - `rating` (decimal) - Note moyenne
  - `completed_jobs` (integer) - Nombre de missions complétées
  
  ### 6. reviews
  Table des avis/commentaires
  - `id` (uuid, PK)
  - `property_id` (uuid, FK → properties)
  - `reservation_id` (uuid, FK → reservations)
  - `reviewer_id` (uuid, FK → users)
  - `rating` (integer) - Note (1-5)
  - `comment` (text) - Commentaire
  - `cleanliness_rating` (integer)
  - `communication_rating` (integer)
  - `checkin_rating` (integer)
  - `accuracy_rating` (integer)
  - `location_rating` (integer)
  - `value_rating` (integer)
  
  ## Sécurité
  - RLS activé sur toutes les tables
  - Politiques restrictives par défaut
  - Accès basé sur l'authentification et les rôles
*/

-- Table users (vérifier si existe)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  first_name text,
  last_name text,
  phone text,
  user_type text NOT NULL DEFAULT 'traveler' CHECK (user_type IN ('owner', 'provider', 'partner', 'admin', 'traveler')),
  created_at timestamptz DEFAULT now()
);

-- Table properties
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  type text NOT NULL,
  address text NOT NULL,
  category text DEFAULT 'Standard',
  neighborhood text,
  surface integer DEFAULT 0,
  max_guests integer NOT NULL DEFAULT 1,
  bedrooms integer DEFAULT 0,
  bathrooms integer DEFAULT 1,
  beds integer DEFAULT 1,
  price_per_night decimal(10,2) NOT NULL DEFAULT 0,
  cleaning_fee decimal(10,2) DEFAULT 0,
  min_nights integer DEFAULT 1,
  max_nights integer DEFAULT 30,
  amenities jsonb DEFAULT '[]'::jsonb,
  images jsonb DEFAULT '[]'::jsonb,
  rules jsonb DEFAULT '[]'::jsonb,
  cancellation_policy text DEFAULT 'flexible',
  check_in_time text DEFAULT '15:00',
  check_out_time text DEFAULT '11:00',
  beach_access boolean DEFAULT false,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table reservations
CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  guest_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  check_in date NOT NULL,
  check_out date NOT NULL,
  adults integer NOT NULL DEFAULT 1,
  children integer DEFAULT 0,
  infants integer DEFAULT 0,
  pets integer DEFAULT 0,
  total_amount decimal(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_method text,
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  special_requests text,
  additional_services jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table host_profiles
CREATE TABLE IF NOT EXISTS host_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  selected_package text,
  commission_rate decimal(5,2) DEFAULT 0,
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

-- Table service_providers
CREATE TABLE IF NOT EXISTS service_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  company text,
  experience text,
  services jsonb DEFAULT '[]'::jsonb,
  availability jsonb DEFAULT '{}'::jsonb,
  hourly_rate decimal(10,2) DEFAULT 0,
  intervention_zones jsonb DEFAULT '[]'::jsonb,
  documents jsonb DEFAULT '[]'::jsonb,
  is_verified boolean DEFAULT false,
  rating decimal(3,2) DEFAULT 0,
  completed_jobs integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table reviews
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  reservation_id uuid REFERENCES reservations(id) ON DELETE SET NULL,
  reviewer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  cleanliness_rating integer CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
  communication_rating integer CHECK (communication_rating >= 1 AND communication_rating <= 5),
  checkin_rating integer CHECK (checkin_rating >= 1 AND checkin_rating <= 5),
  accuracy_rating integer CHECK (accuracy_rating >= 1 AND accuracy_rating <= 5),
  location_rating integer CHECK (location_rating >= 1 AND location_rating <= 5),
  value_rating integer CHECK (value_rating >= 1 AND value_rating <= 5),
  created_at timestamptz DEFAULT now()
);

-- Activer RLS sur toutes les tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE host_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour users
DROP POLICY IF EXISTS "Users can read own profile" ON users;
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Authenticated users can insert their own profile" ON users;
CREATE POLICY "Authenticated users can insert their own profile" ON users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Politiques RLS pour properties
DROP POLICY IF EXISTS "Anyone can view published properties" ON properties;
CREATE POLICY "Anyone can view published properties" ON properties
  FOR SELECT TO authenticated
  USING (is_published = true OR owner_id = auth.uid());

DROP POLICY IF EXISTS "Owners can insert their properties" ON properties;
CREATE POLICY "Owners can insert their properties" ON properties
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Owners can update their properties" ON properties;
CREATE POLICY "Owners can update their properties" ON properties
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Owners can delete their properties" ON properties;
CREATE POLICY "Owners can delete their properties" ON properties
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- Politiques RLS pour reservations
DROP POLICY IF EXISTS "Users can view their reservations" ON reservations;
CREATE POLICY "Users can view their reservations" ON reservations
  FOR SELECT TO authenticated
  USING (
    guest_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = reservations.property_id 
      AND properties.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Guests can create reservations" ON reservations;
CREATE POLICY "Guests can create reservations" ON reservations
  FOR INSERT TO authenticated
  WITH CHECK (guest_id = auth.uid());

DROP POLICY IF EXISTS "Owners and guests can update reservations" ON reservations;
CREATE POLICY "Owners and guests can update reservations" ON reservations
  FOR UPDATE TO authenticated
  USING (
    guest_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = reservations.property_id 
      AND properties.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    guest_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = reservations.property_id 
      AND properties.owner_id = auth.uid()
    )
  );

-- Politiques RLS pour host_profiles
DROP POLICY IF EXISTS "Users can view host profiles" ON host_profiles;
CREATE POLICY "Users can view host profiles" ON host_profiles
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert their host profile" ON host_profiles;
CREATE POLICY "Users can insert their host profile" ON host_profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their host profile" ON host_profiles;
CREATE POLICY "Users can update their host profile" ON host_profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Politiques RLS pour service_providers
DROP POLICY IF EXISTS "Users can view service providers" ON service_providers;
CREATE POLICY "Users can view service providers" ON service_providers
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert their provider profile" ON service_providers;
CREATE POLICY "Users can insert their provider profile" ON service_providers
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their provider profile" ON service_providers;
CREATE POLICY "Users can update their provider profile" ON service_providers
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Politiques RLS pour reviews
DROP POLICY IF EXISTS "Anyone can view reviews" ON reviews;
CREATE POLICY "Anyone can view reviews" ON reviews
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Guests can create reviews for their reservations" ON reviews;
CREATE POLICY "Guests can create reviews for their reservations" ON reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    reviewer_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM reservations 
      WHERE reservations.id = reviews.reservation_id 
      AND reservations.guest_id = auth.uid()
      AND reservations.status = 'completed'
    )
  );

DROP POLICY IF EXISTS "Reviewers can update their reviews" ON reviews;
CREATE POLICY "Reviewers can update their reviews" ON reviews
  FOR UPDATE TO authenticated
  USING (reviewer_id = auth.uid())
  WITH CHECK (reviewer_id = auth.uid());

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_properties_owner ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_published ON properties(is_published);
CREATE INDEX IF NOT EXISTS idx_reservations_property ON reservations(property_id);
CREATE INDEX IF NOT EXISTS idx_reservations_guest ON reservations(guest_id);
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_host_profiles_user ON host_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_service_providers_user ON service_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_property ON reviews(property_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON reviews(reviewer_id);