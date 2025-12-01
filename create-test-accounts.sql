-- Script de création des comptes de test pour Nzoo Immo
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- 1. Créer les utilisateurs de test
INSERT INTO user_profiles (id, email, first_name, last_name, phone, user_type, created_at, updated_at) VALUES
-- Administrateur
('admin-test-001', 'admin@nzooimmo.com', 'Admin', 'Nzoo', '+33123456789', 'admin', NOW(), NOW()),

-- Propriétaires (Hôtes)
('owner-test-001', 'host1@nzooimmo.com', 'Marie', 'Dubois', '+33123456790', 'owner', NOW(), NOW()),
('owner-test-002', 'host2@nzooimmo.com', 'Pierre', 'Martin', '+33123456791', 'owner', NOW(), NOW()),
('owner-test-003', 'host3@nzooimmo.com', 'Sophie', 'Bernard', '+33123456792', 'owner', NOW(), NOW()),

-- Voyageurs
('traveler-test-001', 'traveler1@nzooimmo.com', 'Jean', 'Dupont', '+33123456793', 'traveler', NOW(), NOW()),
('traveler-test-002', 'traveler2@nzooimmo.com', 'Claire', 'Moreau', '+33123456794', 'traveler', NOW(), NOW()),
('traveler-test-003', 'traveler3@nzooimmo.com', 'Thomas', 'Petit', '+33123456795', 'traveler', NOW(), NOW()),

-- Prestataires de service
('provider-test-001', 'provider1@nzooimmo.com', 'Marc', 'Leroy', '+33123456796', 'provider', NOW(), NOW()),
('provider-test-002', 'provider2@nzooimmo.com', 'Julie', 'Roux', '+33123456797', 'provider', NOW(), NOW());

-- 2. Créer des propriétés de test
INSERT INTO properties (
    id, owner_id, title, description, type, address, surface, max_guests, 
    bedrooms, bathrooms, beds, price_per_night, cleaning_fee, min_nights, 
    max_nights, amenities, images, rules, cancellation_policy, check_in_time, 
    check_out_time, category, neighborhood, beach_access, is_published, 
    created_at, updated_at
) VALUES
-- Propriétés de Marie Dubois
('prop-test-001', 'owner-test-001', 'Villa Paradis', 'Magnifique villa avec piscine privée et vue sur mer', 'villa', '123 Avenue de la Plage, Nice', 120, 8, 4, 3, 4, 250, 50, 2, 14, 
 ARRAY['WiFi', 'Piscine', 'Parking', 'Climatisation', 'Cuisine équipée', 'TV'], 
 ARRAY['https://example.com/villa1.jpg', 'https://example.com/villa2.jpg'], 
 ARRAY['Pas de fumeur', 'Animaux acceptés', 'Fête interdite'], 
 'moderate', '15:00', '11:00', 'luxe', 'Nice Centre', true, true, NOW(), NOW()),

('prop-test-002', 'owner-test-001', 'Appartement Moderne', 'Appartement moderne en centre-ville', 'appartement', '45 Rue de la République, Paris', 65, 4, 2, 1, 2, 120, 30, 1, 30, 
 ARRAY['WiFi', 'Climatisation', 'Ascenseur', 'Cuisine équipée'], 
 ARRAY['https://example.com/apt1.jpg'], 
 ARRAY['Pas de fumeur', 'Pas d''animaux'], 
 'flexible', '14:00', '10:00', 'standard', 'Paris 11ème', false, true, NOW(), NOW()),

-- Propriétés de Pierre Martin
('prop-test-003', 'owner-test-002', 'Studio Cosy', 'Studio parfait pour un couple', 'studio', '78 Rue de la Paix, Lyon', 35, 2, 1, 1, 1, 80, 20, 1, 7, 
 ARRAY['WiFi', 'Chauffage', 'Cuisine équipée'], 
 ARRAY['https://example.com/studio1.jpg'], 
 ARRAY['Pas de fumeur'], 
 'strict', '16:00', '11:00', 'budget', 'Lyon Centre', false, true, NOW(), NOW()),

-- Propriétés de Sophie Bernard
('prop-test-004', 'owner-test-003', 'Maison Familiale', 'Grande maison pour familles', 'maison', '12 Impasse des Lilas, Marseille', 150, 10, 5, 3, 6, 200, 60, 3, 21, 
 ARRAY['WiFi', 'Jardin', 'Parking', 'Piscine', 'Cuisine équipée', 'TV', 'Lave-linge'], 
 ARRAY['https://example.com/maison1.jpg', 'https://example.com/maison2.jpg'], 
 ARRAY['Pas de fumeur', 'Animaux acceptés'], 
 'moderate', '15:00', '10:00', 'familial', 'Marseille 8ème', true, true, NOW(), NOW());

-- 3. Créer des réservations de test
INSERT INTO reservations (
    id, property_id, guest_id, check_in, check_out, adults, children, infants, pets, 
    total_amount, status, payment_method, payment_status, special_requests, 
    additional_services, created_at, updated_at
) VALUES
-- Réservations confirmées
('res-test-001', 'prop-test-001', 'traveler-test-001', '2024-02-15', '2024-02-20', 2, 1, 0, 0, 1250, 'confirmed', 'card', 'paid', 'Anniversaire de mariage', ARRAY['petit-déjeuner', 'nettoyage'], NOW(), NOW()),
('res-test-002', 'prop-test-002', 'traveler-test-002', '2024-02-10', '2024-02-12', 2, 0, 0, 0, 240, 'confirmed', 'card', 'paid', 'Voyage d''affaires', ARRAY['wifi-premium'], NOW(), NOW()),
('res-test-003', 'prop-test-003', 'traveler-test-003', '2024-02-05', '2024-02-07', 1, 0, 0, 0, 160, 'confirmed', 'paypal', 'paid', NULL, ARRAY[], NOW(), NOW()),

-- Réservations en attente
('res-test-004', 'prop-test-004', 'traveler-test-001', '2024-03-01', '2024-03-05', 4, 2, 1, 1, 1000, 'pending', 'card', 'pending', 'Famille avec bébé et chien', ARRAY['chaise-haute', 'lit-bébé'], NOW(), NOW()),

-- Réservations terminées
('res-test-005', 'prop-test-001', 'traveler-test-002', '2024-01-10', '2024-01-15', 2, 0, 0, 0, 1250, 'completed', 'card', 'paid', 'Séjour romantique', ARRAY['fleurs', 'champagne'], NOW(), NOW()),
('res-test-006', 'prop-test-002', 'traveler-test-003', '2024-01-20', '2024-01-22', 1, 0, 0, 0, 240, 'completed', 'card', 'paid', NULL, ARRAY[], NOW(), NOW());

-- 4. Créer des avis de test
INSERT INTO reviews (
    id, reservation_id, property_id, guest_id, rating, comment, created_at
) VALUES
('rev-test-001', 'res-test-005', 'prop-test-001', 'traveler-test-002', 5, 'Villa exceptionnelle avec une vue magnifique. Marie est une hôte parfaite, très attentionnée. Je recommande vivement !', NOW()),
('rev-test-002', 'res-test-006', 'prop-test-002', 'traveler-test-003', 4, 'Appartement très bien situé et propre. Petit bémol sur le bruit de la rue mais sinon parfait pour un séjour à Paris.', NOW());

-- 5. Créer des profils d'hôtes
INSERT INTO host_profiles (
    id, user_id, selected_package, commission_rate, description, languages, profession, 
    interests, why_host, hosting_frequency, accommodation_type, guest_types, stay_duration, 
    payment_method, bank_account, bank_name, bank_country, mobile_number, mobile_name, 
    mobile_city, mobile_network, is_verified, created_at, updated_at
) VALUES
('host-prof-001', 'owner-test-001', 'premium', 8.5, 'Passionnée d''hôtellerie et d''accueil, j''aime partager ma région avec les voyageurs', ARRAY['français', 'anglais', 'espagnol'], 'Architecte', 
 ARRAY['voyage', 'cuisine', 'art'], 'Partager ma passion pour ma région', 'frequent', 'villa', 
 ARRAY['couples', 'familles', 'groupes'], 'weekend', 'bank_transfer', 'FR1234567890123456789012', 'BNP Paribas', 'France', 
 '+33123456790', 'Marie Dubois', 'Nice', 'Orange', true, NOW(), NOW()),

('host-prof-002', 'owner-test-002', 'standard', 10.0, 'Propriétaire de plusieurs biens, j''offre un service professionnel', ARRAY['français', 'anglais'], 'Gestionnaire immobilier', 
 ARRAY['immobilier', 'investissement'], 'Diversifier mes revenus', 'regular', 'appartement', 
 ARRAY['voyageurs-affaires', 'couples'], 'short', 'paypal', NULL, NULL, NULL, 
 '+33123456791', 'Pierre Martin', 'Paris', 'SFR', true, NOW(), NOW());

-- 6. Créer des profils de prestataires
INSERT INTO service_providers (
    id, user_id, company, experience, services, availability, hourly_rate, 
    intervention_zones, documents, is_verified, rating, completed_jobs, created_at, updated_at
) VALUES
('prov-prof-001', 'provider-test-001', 'Services Pro Nice', '15 ans d''expérience dans le nettoyage et la maintenance', 
 ARRAY['nettoyage', 'maintenance', 'jardinage', 'réparation'], 
 '{"lundi": {"start": "08:00", "end": "18:00"}, "mardi": {"start": "08:00", "end": "18:00"}, "mercredi": {"start": "08:00", "end": "18:00"}}', 
 25, ARRAY['Nice', 'Cannes', 'Monaco'], ARRAY['certificat-nettoyage.pdf', 'assurance.pdf'], true, 4.8, 156, NOW(), NOW()),

('prov-prof-002', 'provider-test-002', 'Électricité & Plomberie Roux', '10 ans d''expérience en électricité et plomberie', 
 ARRAY['électricité', 'plomberie', 'chauffage', 'climatisation'], 
 '{"lundi": {"start": "07:00", "end": "19:00"}, "mardi": {"start": "07:00", "end": "19:00"}, "mercredi": {"start": "07:00", "end": "19:00"}}', 
 35, ARRAY['Lyon', 'Grenoble', 'Chambéry'], ARRAY['certificat-électricien.pdf', 'assurance.pdf'], true, 4.9, 89, NOW(), NOW());

-- 7. Créer des demandes de service
INSERT INTO service_requests (
    id, property_id, client_id, provider_id, service_type, description, requested_date, 
    status, priority, estimated_duration, created_at, updated_at
) VALUES
('serv-req-001', 'prop-test-001', 'owner-test-001', 'provider-test-001', 'nettoyage', 'Nettoyage complet après départ des invités', '2024-02-21', 'pending', 'high', 4, NOW(), NOW()),
('serv-req-002', 'prop-test-002', 'owner-test-002', 'provider-test-002', 'réparation', 'Réparation du robinet de la cuisine', '2024-02-18', 'accepted', 'medium', 2, NOW(), NOW());

-- 8. Créer des messages de test
INSERT INTO messages (
    id, sender_id, receiver_id, subject, content, is_read, created_at, updated_at
) VALUES
('msg-test-001', 'traveler-test-001', 'admin-test-001', 'Question sur ma réservation', 'Bonjour, j''ai une question concernant ma réservation #res-test-001. Pouvez-vous m''aider ?', false, NOW(), NOW()),
('msg-test-002', 'owner-test-001', 'admin-test-001', 'Problème avec un invité', 'Bonjour, j''ai un problème avec un invité qui ne respecte pas les règles. Que puis-je faire ?', false, NOW(), NOW()),
('msg-test-003', 'admin-test-001', 'traveler-test-001', 'Réponse à votre question', 'Bonjour, je vais examiner votre réservation et vous répondre rapidement.', true, NOW(), NOW());

-- 9. Créer des notifications de test
INSERT INTO notifications (
    id, user_id, type, title, message, is_read, priority, created_at, updated_at
) VALUES
('notif-test-001', 'owner-test-001', 'reservation', 'Nouvelle réservation', 'Vous avez reçu une nouvelle réservation pour Villa Paradis', false, 'high', NOW(), NOW()),
('notif-test-002', 'traveler-test-001', 'payment', 'Paiement confirmé', 'Votre paiement de 1250€ a été confirmé', true, 'medium', NOW(), NOW()),
('notif-test-003', 'provider-test-001', 'service', 'Nouvelle demande', 'Nouvelle demande de service de nettoyage', false, 'high', NOW(), NOW());

-- 10. Afficher un résumé des comptes créés
SELECT 
    'Comptes de test créés avec succès !' as message,
    COUNT(*) as total_users
FROM user_profiles 
WHERE id LIKE '%test%';

-- Afficher les détails des comptes
SELECT 
    user_type,
    COUNT(*) as count,
    STRING_AGG(email, ', ') as emails
FROM user_profiles 
WHERE id LIKE '%test%'
GROUP BY user_type
ORDER BY user_type;


