/*
  # Ajout de propriétés d'exemple et correction des politiques RLS

  1. Correction des politiques RLS
    - Permettre la lecture publique des propriétés actives
    - Corriger les références aux tables

  2. Ajout de données d'exemple
    - Propriétés de test avec toutes les informations nécessaires
    - Images et données réalistes
*/

-- Supprimer les anciennes politiques pour les recréer
DROP POLICY IF EXISTS "Anyone can read active properties" ON properties;

-- Créer une nouvelle politique plus permissive pour la lecture
CREATE POLICY "Public can read active properties" ON properties
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- Insérer des propriétés d'exemple
INSERT INTO properties (
  title, 
  description, 
  type, 
  address, 
  location,
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
  'Gombe, Kinshasa',
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
  'Ngaliema, Kinshasa',
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
  'Kinshasa Centre',
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
  'Lemba, Kinshasa',
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
  'Bandalungwa, Kinshasa',
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

-- Ajouter quelques avis d'exemple
INSERT INTO reviews (property_id, rating, comment, guest_id) 
SELECT 
  p.id,
  (4 + random())::integer, -- Note entre 4 et 5
  CASE 
    WHEN random() < 0.5 THEN 'Excellent séjour ! Propriété conforme à la description et hôte très accueillant.'
    ELSE 'Très bel hébergement, bien situé et propre. Je recommande vivement !'
  END,
  gen_random_uuid() -- ID d'invité fictif
FROM properties p
WHERE p.is_active = true;