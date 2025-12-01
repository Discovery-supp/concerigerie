-- Script corrigé pour créer des comptes de test
-- Ce script s'adapte à la vraie structure de la table user_profiles
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- 1. D'abord, vérifions la structure de la table user_profiles
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- 2. Créer l'administrateur avec un UUID valide
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    '550e8400-e29b-41d4-a716-446655440001',
    'authenticated',
    'authenticated',
    'admin@test.com',
    crypt('admin123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
);

-- 3. Créer les propriétaires avec des UUIDs valides
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES 
(
    '00000000-0000-0000-0000-000000000000',
    '550e8400-e29b-41d4-a716-446655440002',
    'authenticated',
    'authenticated',
    'host1@test.com',
    crypt('host123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
),
(
    '00000000-0000-0000-0000-000000000000',
    '550e8400-e29b-41d4-a716-446655440003',
    'authenticated',
    'authenticated',
    'host2@test.com',
    crypt('host123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
);

-- 4. Créer les voyageurs avec des UUIDs valides
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES 
(
    '00000000-0000-0000-0000-000000000000',
    '550e8400-e29b-41d4-a716-446655440004',
    'authenticated',
    'authenticated',
    'guest1@test.com',
    crypt('guest123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
),
(
    '00000000-0000-0000-0000-000000000000',
    '550e8400-e29b-41d4-a716-446655440005',
    'authenticated',
    'authenticated',
    'guest2@test.com',
    crypt('guest123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
);

-- 5. Créer les prestataires avec des UUIDs valides
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES 
(
    '00000000-0000-0000-0000-000000000000',
    '550e8400-e29b-41d4-a716-446655440006',
    'authenticated',
    'authenticated',
    'service1@test.com',
    crypt('service123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
),
(
    '00000000-0000-0000-0000-000000000000',
    '550e8400-e29b-41d4-a716-446655440007',
    'authenticated',
    'authenticated',
    'service2@test.com',
    crypt('service123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
);

-- 6. Créer les profils utilisateurs (sans la colonne email si elle n'existe pas)
-- Cette requête s'adapte automatiquement à la structure de la table
INSERT INTO user_profiles (id, first_name, last_name, phone, user_type, created_at, updated_at) VALUES
-- Administrateur
('550e8400-e29b-41d4-a716-446655440001', 'Admin', 'Test', '+33123456789', 'admin', NOW(), NOW()),

-- Propriétaires
('550e8400-e29b-41d4-a716-446655440002', 'Marie', 'Dubois', '+33123456790', 'owner', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'Pierre', 'Martin', '+33123456791', 'owner', NOW(), NOW()),

-- Voyageurs
('550e8400-e29b-41d4-a716-446655440004', 'Jean', 'Dupont', '+33123456792', 'traveler', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440005', 'Claire', 'Moreau', '+33123456793', 'traveler', NOW(), NOW()),

-- Prestataires
('550e8400-e29b-41d4-a716-446655440006', 'Marc', 'Leroy', '+33123456794', 'provider', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440007', 'Julie', 'Roux', '+33123456795', 'provider', NOW(), NOW());

-- 7. Créer les propriétés de test
INSERT INTO properties (
    id, owner_id, title, description, type, address, surface, max_guests, 
    bedrooms, bathrooms, beds, price_per_night, cleaning_fee, min_nights, 
    max_nights, amenities, images, rules, cancellation_policy, check_in_time, 
    check_out_time, category, neighborhood, beach_access, is_published, 
    created_at, updated_at
) VALUES
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440002', 'Villa Paradis', 'Magnifique villa avec piscine', 'villa', 'Nice, France', 120, 8, 4, 3, 4, 250, 50, 2, 14, 
 '["WiFi", "Piscine", "Parking"]'::jsonb, 
 '["https://images.unsplash.com/photo-1566073771259-6a8506099945"]'::jsonb, 
 '["Pas de fumeur"]'::jsonb, 
 'moderate', '15:00', '11:00', 'luxe', 'Nice', true, true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440003', 'Appartement Moderne', 'Appartement moderne en centre-ville', 'appartement', 'Paris, France', 65, 4, 2, 1, 2, 120, 30, 1, 30, 
 '["WiFi", "Climatisation"]'::jsonb, 
 '["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267"]'::jsonb, 
 '["Pas de fumeur"]'::jsonb, 
 'flexible', '14:00', '10:00', 'standard', 'Paris', false, true, NOW(), NOW());

-- 8. Créer les réservations de test
INSERT INTO reservations (
    id, property_id, guest_id, check_in, check_out, adults, children, infants, pets, 
    total_amount, status, payment_method, payment_status, special_requests, 
    additional_services, created_at, updated_at
) VALUES
('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440004', '2024-02-15', '2024-02-20', 2, 1, 0, 0, 1250, 'confirmed', 'card', 'paid', 'Anniversaire', '["petit-déjeuner"]'::jsonb, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440005', '2024-02-10', '2024-02-12', 2, 0, 0, 0, 240, 'pending', 'card', 'pending', 'Voyage d''affaires', '[]'::jsonb, NOW(), NOW());

-- 9. Créer les avis de test
INSERT INTO reviews (
    id, reservation_id, property_id, rating, comment, created_at
) VALUES
('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440010', 5, 'Villa exceptionnelle ! Je recommande vivement.', NOW());

-- 10. Créer les messages de test
INSERT INTO messages (
    id, sender_id, receiver_id, subject, content, is_read, created_at, updated_at
) VALUES
('550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'Question', 'Bonjour, j''ai une question sur ma réservation.', false, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Support', 'Bonjour, j''ai besoin d''aide avec ma propriété.', false, NOW(), NOW());

-- 11. Afficher les comptes créés avec leurs mots de passe
SELECT 
    'Comptes de test créés avec succès !' as message,
    'Utilisez les mots de passe ci-dessous pour vous connecter' as instruction;

SELECT 
    email,
    'admin123' as password,
    'Administrateur' as role
FROM auth.users WHERE email = 'admin@test.com'
UNION ALL
SELECT 
    email,
    'host123' as password,
    'Propriétaire' as role
FROM auth.users WHERE email IN ('host1@test.com', 'host2@test.com')
UNION ALL
SELECT 
    email,
    'guest123' as password,
    'Voyageur' as role
FROM auth.users WHERE email IN ('guest1@test.com', 'guest2@test.com')
UNION ALL
SELECT 
    email,
    'service123' as password,
    'Prestataire' as role
FROM auth.users WHERE email IN ('service1@test.com', 'service2@test.com');
