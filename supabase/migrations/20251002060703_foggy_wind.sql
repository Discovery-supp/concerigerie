/*
  # Création de la table properties manquante

  1. Nouvelle Table
    - `properties` - Propriétés/annonces immobilières avec toutes les colonnes nécessaires

  2. Sécurité
    - RLS activé sur la table
    - Politiques d'accès appropriées

  3. Index et performances
    - Index sur les colonnes fréquemment utilisées
    - Triggers pour les timestamps
*/

-- Créer la table properties si elle n'existe pas
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Activer RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Public can read active properties" ON properties
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Owners can manage their properties" ON properties
  FOR ALL TO authenticated
  USING (owner_id = auth.uid());

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_is_active ON properties(is_active);
CREATE INDEX IF NOT EXISTS idx_properties_category ON properties(category);
CREATE INDEX IF NOT EXISTS idx_properties_neighborhood ON properties(neighborhood);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price_per_night);

-- Fonction pour mise à jour automatique des timestamps
CREATE OR REPLACE FUNCTION update_properties_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mise à jour automatique
CREATE TRIGGER update_properties_updated_at_trigger 
  BEFORE UPDATE ON properties
  FOR EACH ROW 
  EXECUTE FUNCTION update_properties_updated_at();

-- Insérer quelques propriétés d'exemple
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
  'Appartement',
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
  'Villa',
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
  'Studio',
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
  'Maison entière',
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
  'Loft',
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