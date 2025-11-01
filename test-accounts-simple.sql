-- Script simplifié pour créer les comptes de test
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- 1. Créer un administrateur
INSERT INTO user_profiles (id, email, first_name, last_name, phone, user_type, created_at, updated_at) 
VALUES ('admin-001', 'admin@test.com', 'Admin', 'Test', '+33123456789', 'admin', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. Créer des propriétaires
INSERT INTO user_profiles (id, email, first_name, last_name, phone, user_type, created_at, updated_at) 
VALUES 
('owner-001', 'host1@test.com', 'Marie', 'Dubois', '+33123456790', 'owner', NOW(), NOW()),
('owner-002', 'host2@test.com', 'Pierre', 'Martin', '+33123456791', 'owner', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. Créer des voyageurs
INSERT INTO user_profiles (id, email, first_name, last_name, phone, user_type, created_at, updated_at) 
VALUES 
('traveler-001', 'guest1@test.com', 'Jean', 'Dupont', '+33123456792', 'traveler', NOW(), NOW()),
('traveler-002', 'guest2@test.com', 'Claire', 'Moreau', '+33123456793', 'traveler', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 4. Créer des prestataires
INSERT INTO user_profiles (id, email, first_name, last_name, phone, user_type, created_at, updated_at) 
VALUES 
('provider-001', 'service1@test.com', 'Marc', 'Leroy', '+33123456794', 'provider', NOW(), NOW()),
('provider-002', 'service2@test.com', 'Julie', 'Roux', '+33123456795', 'provider', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 5. Créer des propriétés de test
INSERT INTO properties (
    id, owner_id, title, description, type, address, surface, max_guests, 
    bedrooms, bathrooms, beds, price_per_night, cleaning_fee, min_nights, 
    max_nights, amenities, images, rules, cancellation_policy, check_in_time, 
    check_out_time, category, neighborhood, beach_access, is_published, 
    created_at, updated_at
) VALUES
('prop-001', 'owner-001', 'Villa Paradis', 'Magnifique villa avec piscine', 'villa', 'Nice, France', 120, 8, 4, 3, 4, 250, 50, 2, 14, 
 ARRAY['WiFi', 'Piscine', 'Parking'], 
 ARRAY['https://images.unsplash.com/photo-1566073771259-6a8506099945'], 
 ARRAY['Pas de fumeur'], 
 'moderate', '15:00', '11:00', 'luxe', 'Nice', true, true, NOW(), NOW()),
('prop-002', 'owner-002', 'Appartement Moderne', 'Appartement moderne en centre-ville', 'appartement', 'Paris, France', 65, 4, 2, 1, 2, 120, 30, 1, 30, 
 ARRAY['WiFi', 'Climatisation'], 
 ARRAY['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'], 
 ARRAY['Pas de fumeur'], 
 'flexible', '14:00', '10:00', 'standard', 'Paris', false, true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 6. Créer des réservations de test
INSERT INTO reservations (
    id, property_id, guest_id, check_in, check_out, adults, children, infants, pets, 
    total_amount, status, payment_method, payment_status, special_requests, 
    additional_services, created_at, updated_at
) VALUES
('res-001', 'prop-001', 'traveler-001', '2024-02-15', '2024-02-20', 2, 1, 0, 0, 1250, 'confirmed', 'card', 'paid', 'Anniversaire', ARRAY['petit-déjeuner'], NOW(), NOW()),
('res-002', 'prop-002', 'traveler-002', '2024-02-10', '2024-02-12', 2, 0, 0, 0, 240, 'pending', 'card', 'pending', 'Voyage d''affaires', ARRAY[], NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 7. Créer des avis de test
INSERT INTO reviews (
    id, reservation_id, property_id, guest_id, rating, comment, created_at
) VALUES
('rev-001', 'res-001', 'prop-001', 'traveler-001', 5, 'Villa exceptionnelle ! Je recommande vivement.', NOW())
ON CONFLICT (id) DO NOTHING;

-- 8. Créer des messages de test
INSERT INTO messages (
    id, sender_id, receiver_id, subject, content, is_read, created_at, updated_at
) VALUES
('msg-001', 'traveler-001', 'admin-001', 'Question', 'Bonjour, j''ai une question sur ma réservation.', false, NOW(), NOW()),
('msg-002', 'owner-001', 'admin-001', 'Support', 'Bonjour, j''ai besoin d''aide avec ma propriété.', false, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Vérifier que tout a été créé
SELECT 'Comptes de test créés !' as status;
SELECT user_type, COUNT(*) as count FROM user_profiles WHERE id LIKE '%001' OR id LIKE '%002' GROUP BY user_type;


