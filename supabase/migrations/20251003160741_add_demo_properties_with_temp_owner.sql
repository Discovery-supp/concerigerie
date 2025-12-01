/*
  # Ajout de propriétés de démonstration
  
  ## Notes
  - Les propriétés auront un owner_id temporaire
  - Seront visibles mais pas modifiables jusqu'à ce qu'un vrai propriétaire s'inscrive
*/

-- Supprimer temporairement la contrainte
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_owner_id_fkey;

-- Insérer les propriétés de démo
INSERT INTO properties (
  owner_id,
  title,
  description,
  type,
  address,
  category,
  neighborhood,
  surface,
  max_guests,
  bedrooms,
  bathrooms,
  beds,
  price_per_night,
  cleaning_fee,
  min_nights,
  max_nights,
  amenities,
  images,
  rules,
  cancellation_policy,
  check_in_time,
  check_out_time,
  beach_access,
  is_published
) VALUES
(
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Magnifique appartement moderne à Gombe',
  'Superbe appartement entièrement rénové au cœur de Gombe, proche de tous les services. Vue imprenable sur le fleuve Congo.',
  'Appartement',
  'Avenue de la Libération, Gombe, Kinshasa',
  'Luxe',
  'Gombe',
  120, 4, 2, 2, 3,
  150.00, 30.00, 2, 30,
  '["Wi-Fi", "Climatisation", "Télévision", "Cuisine", "Parking gratuit"]'::jsonb,
  '["https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg"]'::jsonb,
  '["Non fumeur", "Pas de fêtes"]'::jsonb,
  'flexible', '14:00', '11:00', false, true
),
(
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Villa luxueuse avec piscine à Ngaliema',
  'Magnifique villa de standing avec piscine privée, jardin tropical et vue panoramique.',
  'Villa',
  'Boulevard Triomphal, Ngaliema, Kinshasa',
  'Premium',
  'Ngaliema',
  350, 8, 4, 3, 6,
  300.00, 50.00, 3, 60,
  '["Wi-Fi", "Climatisation", "Piscine", "Jardin", "Sécurité"]'::jsonb,
  '["https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg"]'::jsonb,
  '["Non fumeur"]'::jsonb,
  'modérée', '15:00', '11:00', false, true
),
(
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Studio confortable à Kinshasa Centre',
  'Studio fonctionnel et bien équipé, idéal pour les courts séjours. Proche des commerces.',
  'Studio',
  'Avenue Colonel Ebeya, Kinshasa Centre',
  'Standard',
  'Kinshasa Centre',
  45, 2, 1, 1, 1,
  50.00, 15.00, 1, 30,
  '["Wi-Fi", "Climatisation", "Télévision"]'::jsonb,
  '["https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg"]'::jsonb,
  '["Non fumeur"]'::jsonb,
  'flexible', '14:00', '12:00', false, true
),
(
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Maison familiale spacieuse à Lemba',
  'Grande maison familiale avec jardin, parfaite pour les séjours en famille ou entre amis.',
  'Maison entière',
  'Avenue Kabasele, Lemba, Kinshasa',
  'Confort',
  'Lemba',
  200, 6, 3, 2, 4,
  120.00, 25.00, 2, 45,
  '["Wi-Fi", "Climatisation", "Cuisine", "Jardin"]'::jsonb,
  '["https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg"]'::jsonb,
  '["Non fumeur"]'::jsonb,
  'flexible', '15:00', '11:00', false, true
),
(
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Appartement économique à Bandalungwa',
  'Appartement simple mais propre et fonctionnel. Parfait pour les petits budgets.',
  'Appartement',
  'Avenue Lumumba, Bandalungwa, Kinshasa',
  'Économique',
  'Bandalungwa',
  60, 3, 1, 1, 2,
  35.00, 10.00, 1, 30,
  '["Wi-Fi", "Télévision"]'::jsonb,
  '["https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg"]'::jsonb,
  '["Non fumeur"]'::jsonb,
  'flexible', '13:00', '11:00', false, true
),
(
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Studio avec accès plage privée',
  'Charmant studio avec accès direct à une petite plage privée sur le fleuve Congo.',
  'Studio',
  'Rive du Congo, Ngaliema, Kinshasa',
  'Luxe',
  'Ngaliema',
  55, 2, 1, 1, 1,
  110.00, 20.00, 2, 20,
  '["Wi-Fi", "Climatisation", "Accès plage"]'::jsonb,
  '["https://images.pexels.com/photos/1268871/pexels-photo-1268871.jpeg"]'::jsonb,
  '["Non fumeur"]'::jsonb,
  'modérée', '14:00', '11:00', true, true
)
ON CONFLICT DO NOTHING;