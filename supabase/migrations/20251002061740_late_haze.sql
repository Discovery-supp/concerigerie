/*
  # Structure complète de la base de données Nzoo Immo Conciergerie
  
  Cette migration crée toute la structure nécessaire pour l'application de conciergerie Airbnb.
  
  ## Tables principales :
  1. users - Utilisateurs (propriétaires, voyageurs, partenaires, prestataires, admin)
  2. properties - Propriétés/annonces immobilières
  3. reservations - Réservations des clients
  4. service_providers - Prestataires de services
  5. host_profiles - Profils détaillés des hôtes
  6. reviews - Avis et commentaires
  
  ## Fonctionnalités :
  - Authentification multi-rôles
  - Gestion complète des propriétés
  - Système de réservation
  - Réseau de prestataires
  - Système d'avis
  - Sécurité RLS complète
*/

-- Extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- TABLE: users (Utilisateurs)
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  user_type text NOT NULL DEFAULT 'traveler' CHECK (user_type IN ('owner', 'traveler', 'partner', 'provider', 'admin')),
  profile_image text,
  is_active boolean DEFAULT true,
  email_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- TABLE: properties (Propriétés)
-- =============================================
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  type text NOT NULL, -- 'apartment', 'house', 'villa', 'studio', 'room'
  address text NOT NULL,
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  surface integer DEFAULT 0,
  max_guests integer NOT NULL DEFAULT 1,
  bedrooms integer NOT NULL DEFAULT 0,
  bathrooms integer NOT NULL DEFAULT 1,
  beds integer NOT NULL DEFAULT 1,
  price_per_night decimal(10,2) NOT NULL DEFAULT 0,
  cleaning_fee decimal(10,2) DEFAULT 0,
  service_fee_rate decimal(5,4) DEFAULT 0.12, -- 12% par défaut
  min_nights integer DEFAULT 1,
  max_nights integer DEFAULT 30,
  amenities text[] DEFAULT '{}',
  images text[] DEFAULT '{}',
  rules text[] DEFAULT '{}',
  cancellation_policy text DEFAULT 'flexible' CHECK (cancellation_policy IN ('flexible', 'moderate', 'strict')),
  check_in_time time DEFAULT '15:00',
  check_out_time time DEFAULT '11:00',
  category text DEFAULT 'Standard' CHECK (category IN ('Économique', 'Standard', 'Confort', 'Luxe', 'Premium')),
  neighborhood text,
  beach_access boolean DEFAULT false,
  instant_book boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- TABLE: reservations (Réservations)
-- =============================================
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
  subtotal decimal(10,2) NOT NULL DEFAULT 0,
  cleaning_fee decimal(10,2) DEFAULT 0,
  service_fee decimal(10,2) DEFAULT 0,
  tourist_tax decimal(10,2) DEFAULT 0,
  total_amount decimal(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'refunded')),
  payment_method text NOT NULL,
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'refunded', 'failed')),
  payment_intent_id text, -- Pour Stripe
  special_requests text,
  additional_services text[] DEFAULT '{}',
  guest_notes text,
  host_notes text,
  cancellation_reason text,
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- TABLE: service_providers (Prestataires)
-- =============================================
CREATE TABLE IF NOT EXISTS service_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  company text,
  business_registration text, -- RCCM
  tax_number text,
  experience text NOT NULL,
  services text[] NOT NULL DEFAULT '{}',
  specialties text,
  availability jsonb DEFAULT '{}',
  hourly_rate decimal(10,2) NOT NULL DEFAULT 0,
  travel_fee decimal(10,2) DEFAULT 0,
  urgency_rate_percent integer DEFAULT 0, -- Majoration urgence en %
  evening_rate_percent integer DEFAULT 0, -- Majoration soirée en %
  weekend_rate_percent integer DEFAULT 0, -- Majoration week-end en %
  intervention_zones text[] DEFAULT '{}',
  equipment text[] DEFAULT '{}',
  documents text[] DEFAULT '{}', -- URLs des documents
  portfolio_images text[] DEFAULT '{}',
  is_verified boolean DEFAULT false,
  verification_date timestamptz,
  rating decimal(3,2) DEFAULT 0,
  total_reviews integer DEFAULT 0,
  completed_jobs integer DEFAULT 0,
  response_time_hours integer DEFAULT 24,
  languages text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- TABLE: host_profiles (Profils Hôtes)
-- =============================================
CREATE TABLE IF NOT EXISTS host_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  selected_package text NOT NULL CHECK (selected_package IN ('essential', 'complete', 'premium')),
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
  response_rate decimal(5,2) DEFAULT 0, -- Taux de réponse en %
  response_time_hours integer DEFAULT 24,
  
  -- Informations de paiement
  payment_method text NOT NULL CHECK (payment_method IN ('bank', 'mobile_money', 'cash')),
  bank_account text,
  bank_name text,
  bank_country text,
  mobile_number text,
  mobile_name text,
  mobile_city text,
  mobile_network text,
  
  -- Statut et vérification
  is_verified boolean DEFAULT false,
  verification_date timestamptz,
  superhost boolean DEFAULT false,
  superhost_since timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- TABLE: reviews (Avis)
-- =============================================
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid REFERENCES reservations(id) ON DELETE CASCADE,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  guest_id uuid REFERENCES users(id) ON DELETE CASCADE,
  host_id uuid REFERENCES users(id) ON DELETE CASCADE,
  
  -- Notes détaillées
  overall_rating integer NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  cleanliness_rating integer CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
  accuracy_rating integer CHECK (accuracy_rating >= 1 AND accuracy_rating <= 5),
  communication_rating integer CHECK (communication_rating >= 1 AND communication_rating <= 5),
  location_rating integer CHECK (location_rating >= 1 AND location_rating <= 5),
  value_rating integer CHECK (value_rating >= 1 AND value_rating <= 5),
  
  comment text NOT NULL,
  host_response text,
  host_response_date timestamptz,
  
  -- Métadonnées
  is_public boolean DEFAULT true,
  helpful_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- TABLE: service_requests (Demandes de service)
-- =============================================
CREATE TABLE IF NOT EXISTS service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  host_id uuid REFERENCES users(id) ON DELETE CASCADE,
  provider_id uuid REFERENCES service_providers(id) ON DELETE SET NULL,
  service_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
  scheduled_date timestamptz,
  completed_date timestamptz,
  estimated_cost decimal(10,2),
  final_cost decimal(10,2),
  notes text,
  images text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- TABLE: messages (Messages/Chat)
-- =============================================
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  sender_id uuid REFERENCES users(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES users(id) ON DELETE CASCADE,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  content text NOT NULL,
  attachments text[] DEFAULT '{}',
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- TABLE: notifications (Notifications)
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}',
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- ACTIVATION RLS (Row Level Security)
-- =============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE host_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLITIQUES RLS - USERS
-- =============================================
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Public can read basic user info" ON users
  FOR SELECT TO authenticated
  USING (true);

-- =============================================
-- POLITIQUES RLS - PROPERTIES
-- =============================================
CREATE POLICY "Anyone can read active properties" ON properties
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Owners can manage their properties" ON properties
  FOR ALL TO authenticated
  USING (owner_id = auth.uid());

-- =============================================
-- POLITIQUES RLS - RESERVATIONS
-- =============================================
CREATE POLICY "Users can read their reservations" ON reservations
  FOR SELECT TO authenticated
  USING (
    guest_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM properties WHERE id = property_id AND owner_id = auth.uid())
  );

CREATE POLICY "Guests can create reservations" ON reservations
  FOR INSERT TO authenticated
  WITH CHECK (guest_id = auth.uid());

CREATE POLICY "Users can update their reservations" ON reservations
  FOR UPDATE TO authenticated
  USING (
    guest_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM properties WHERE id = property_id AND owner_id = auth.uid())
  );

-- =============================================
-- POLITIQUES RLS - SERVICE_PROVIDERS
-- =============================================
CREATE POLICY "Anyone can read verified providers" ON service_providers
  FOR SELECT TO authenticated
  USING (is_verified = true);

CREATE POLICY "Providers can manage their profile" ON service_providers
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- =============================================
-- POLITIQUES RLS - HOST_PROFILES
-- =============================================
CREATE POLICY "Hosts can manage their profile" ON host_profiles
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- =============================================
-- POLITIQUES RLS - REVIEWS
-- =============================================
CREATE POLICY "Anyone can read public reviews" ON reviews
  FOR SELECT TO authenticated
  USING (is_public = true);

CREATE POLICY "Guests can create reviews for their reservations" ON reviews
  FOR INSERT TO authenticated
  WITH CHECK (guest_id = auth.uid());

CREATE POLICY "Users can update their own reviews" ON reviews
  FOR UPDATE TO authenticated
  USING (guest_id = auth.uid() OR host_id = auth.uid());

-- =============================================
-- POLITIQUES RLS - SERVICE_REQUESTS
-- =============================================
CREATE POLICY "Hosts can manage their service requests" ON service_requests
  FOR ALL TO authenticated
  USING (host_id = auth.uid());

CREATE POLICY "Providers can read assigned requests" ON service_requests
  FOR SELECT TO authenticated
  USING (
    provider_id = auth.uid() OR
    EXISTS (SELECT 1 FROM service_providers WHERE user_id = auth.uid() AND is_verified = true)
  );

-- =============================================
-- POLITIQUES RLS - MESSAGES
-- =============================================
CREATE POLICY "Users can read their messages" ON messages
  FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- =============================================
-- POLITIQUES RLS - NOTIFICATIONS
-- =============================================
CREATE POLICY "Users can read their notifications" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- =============================================
-- INDEX POUR PERFORMANCES
-- =============================================

-- Index pour users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Index pour properties
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_is_active ON properties(is_active);
CREATE INDEX IF NOT EXISTS idx_properties_category ON properties(category);
CREATE INDEX IF NOT EXISTS idx_properties_neighborhood ON properties(neighborhood);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price_per_night);
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);

-- Index pour reservations
CREATE INDEX IF NOT EXISTS idx_reservations_property_id ON reservations(property_id);
CREATE INDEX IF NOT EXISTS idx_reservations_guest_id ON reservations(guest_id);
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_created_at ON reservations(created_at);

-- Index pour service_providers
CREATE INDEX IF NOT EXISTS idx_service_providers_user_id ON service_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_service_providers_is_verified ON service_providers(is_verified);
CREATE INDEX IF NOT EXISTS idx_service_providers_rating ON service_providers(rating);
CREATE INDEX IF NOT EXISTS idx_service_providers_services ON service_providers USING GIN(services);

-- Index pour host_profiles
CREATE INDEX IF NOT EXISTS idx_host_profiles_user_id ON host_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_host_profiles_is_verified ON host_profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_host_profiles_superhost ON host_profiles(superhost);

-- Index pour reviews
CREATE INDEX IF NOT EXISTS idx_reviews_property_id ON reviews(property_id);
CREATE INDEX IF NOT EXISTS idx_reviews_guest_id ON reviews(guest_id);
CREATE INDEX IF NOT EXISTS idx_reviews_host_id ON reviews(host_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reservation_id ON reviews(reservation_id);
CREATE INDEX IF NOT EXISTS idx_reviews_overall_rating ON reviews(overall_rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);

-- Index pour service_requests
CREATE INDEX IF NOT EXISTS idx_service_requests_property_id ON service_requests(property_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_host_id ON service_requests(host_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_provider_id ON service_requests(provider_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);

-- Index pour messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Index pour notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- =============================================
-- FONCTIONS ET TRIGGERS
-- =============================================

-- Fonction pour mise à jour automatique des timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour mise à jour automatique des timestamps
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

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_requests_updated_at BEFORE UPDATE ON service_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour calculer la note moyenne d'une propriété
CREATE OR REPLACE FUNCTION calculate_property_rating(property_uuid uuid)
RETURNS decimal AS $$
DECLARE
    avg_rating decimal;
BEGIN
    SELECT AVG(overall_rating) INTO avg_rating
    FROM reviews 
    WHERE property_id = property_uuid AND is_public = true;
    
    RETURN COALESCE(avg_rating, 0);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer la note moyenne d'un prestataire
CREATE OR REPLACE FUNCTION calculate_provider_rating(provider_uuid uuid)
RETURNS decimal AS $$
DECLARE
    avg_rating decimal;
BEGIN
    -- Cette fonction sera étendue quand nous aurons une table pour les avis prestataires
    RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- DONNÉES D'EXEMPLE
-- =============================================

-- Insertion de propriétés d'exemple
INSERT INTO properties (
  title, 
  description, 
  type, 
  address, 
  surface,
  max_guests, 
  bedrooms, 
  bathrooms, 
  beds,
  price_per_night, 
  cleaning_fee,
  amenities, 
  images,
  category, 
  neighborhood, 
  is_active
) VALUES 
(
  'Appartement Moderne Gombe avec Vue Fleuve',
  'Magnifique appartement de 120m² avec vue imprenable sur le fleuve Congo. Entièrement rénové avec tous les équipements modernes. Parfait pour les voyageurs d''affaires et les familles. Situé au cœur de Gombe, proche de tous les services.',
  'apartment',
  '123 Avenue des Martyrs, Gombe, Kinshasa',
  120,
  4,
  2,
  2,
  2,
  85.00,
  25.00,
  ARRAY['Wi-Fi', 'Parking gratuit', 'Cuisine', 'Télévision', 'Climatisation'],
  ARRAY['https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg', 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg'],
  'Confort',
  'Gombe',
  true
),
(
  'Villa Luxueuse Ngaliema avec Piscine',
  'Superbe villa de 300m² avec piscine privée et jardin tropical. 4 chambres spacieuses, parfaite pour les groupes et familles nombreuses. Quartier résidentiel calme et sécurisé. Service de conciergerie disponible.',
  'villa',
  '456 Boulevard du 30 Juin, Ngaliema, Kinshasa',
  300,
  8,
  4,
  3,
  5,
  150.00,
  40.00,
  ARRAY['Wi-Fi', 'Parking gratuit', 'Piscine', 'Cuisine', 'Télévision', 'Climatisation'],
  ARRAY['https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg', 'https://images.pexels.com/photos/1396132/pexels-photo-1396132.jpeg'],
  'Luxe',
  'Ngaliema',
  true
),
(
  'Studio Cosy Centre-Ville Business',
  'Studio moderne de 45m² idéalement situé au centre-ville. Parfait pour les voyageurs d''affaires avec espace de travail dédié. Accès facile aux transports et restaurants. Connexion internet haut débit.',
  'studio',
  '789 Avenue Kasa-Vubu, Kinshasa Centre',
  45,
  2,
  1,
  1,
  1,
  45.00,
  15.00,
  ARRAY['Wi-Fi', 'Cuisine', 'Télévision', 'Climatisation', 'Espace de travail'],
  ARRAY['https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg', 'https://images.pexels.com/photos/2029667/pexels-photo-2029667.jpeg'],
  'Standard',
  'Kinshasa Centre',
  true
),
(
  'Maison Familiale Lemba avec Jardin',
  'Belle maison familiale de 180m² avec grand jardin sécurisé. Idéale pour les familles avec enfants. 3 chambres confortables, salon spacieux et cuisine équipée. Quartier calme avec écoles et commerces à proximité.',
  'house',
  '321 Avenue Lumumba, Lemba, Kinshasa',
  180,
  6,
  3,
  2,
  4,
  65.00,
  20.00,
  ARRAY['Wi-Fi', 'Parking gratuit', 'Cuisine', 'Télévision', 'Jardin'],
  ARRAY['https://images.pexels.com/photos/1438832/pexels-photo-1438832.jpeg', 'https://images.pexels.com/photos/1571453/pexels-photo-1571453.jpeg'],
  'Confort',
  'Lemba',
  true
),
(
  'Loft Moderne Bandalungwa Design',
  'Loft contemporain de 90m² avec design moderne et épuré. Espace ouvert avec mezzanine, parfait pour les couples ou voyageurs solo. Quartier artistique en développement avec cafés et galeries.',
  'loft',
  '654 Avenue de la Libération, Bandalungwa, Kinshasa',
  90,
  3,
  1,
  1,
  2,
  55.00,
  18.00,
  ARRAY['Wi-Fi', 'Cuisine', 'Télévision', 'Climatisation', 'Design moderne'],
  ARRAY['https://images.pexels.com/photos/2029541/pexels-photo-2029541.jpeg', 'https://images.pexels.com/photos/1571457/pexels-photo-1571457.jpeg'],
  'Standard',
  'Bandalungwa',
  true
);

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Base de données Nzoo Immo Conciergerie créée avec succès !';
    RAISE NOTICE 'Tables créées: users, properties, reservations, service_providers, host_profiles, reviews, service_requests, messages, notifications';
    RAISE NOTICE 'RLS activé sur toutes les tables avec politiques de sécurité appropriées';
    RAISE NOTICE 'Index créés pour optimiser les performances';
    RAISE NOTICE 'Données d''exemple ajoutées pour les tests';
END $$;