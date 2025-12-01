-- Script pour insérer des données de test
-- Exécutez ce script après avoir créé les tables manquantes

-- 1. Insérer des notifications de test
INSERT INTO notifications (user_id, type, title, message, is_read, priority, created_at) VALUES
-- Notifications pour l'administrateur
('550e8400-e29b-41d4-a716-446655440001', 'system', 'Bienvenue', 'Bienvenue dans votre tableau de bord administrateur', false, 'low', NOW()),
('550e8400-e29b-41d4-a716-446655440001', 'reservation', 'Nouvelle réservation', 'Une nouvelle réservation a été créée', false, 'high', NOW()),

-- Notifications pour les propriétaires
('550e8400-e29b-41d4-a716-446655440002', 'reservation', 'Nouvelle réservation', 'Vous avez reçu une nouvelle réservation pour Villa Paradis', false, 'high', NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'review', 'Nouvel avis', 'Vous avez reçu un nouvel avis 5 étoiles', false, 'medium', NOW()),

('550e8400-e29b-41d4-a716-446655440003', 'reservation', 'Nouvelle réservation', 'Vous avez reçu une nouvelle réservation pour Appartement Moderne', false, 'high', NOW()),

-- Notifications pour les voyageurs
('550e8400-e29b-41d4-a716-446655440004', 'reservation', 'Réservation confirmée', 'Votre réservation pour Villa Paradis a été confirmée', true, 'high', NOW()),
('550e8400-e29b-41d4-a716-446655440004', 'payment', 'Paiement confirmé', 'Votre paiement de 1250€ a été confirmé', true, 'medium', NOW()),

('550e8400-e29b-41d4-a716-446655440005', 'reservation', 'Réservation en attente', 'Votre réservation pour Appartement Moderne est en attente de confirmation', false, 'medium', NOW()),

-- Notifications pour les prestataires
('550e8400-e29b-41d4-a716-446655440006', 'service', 'Nouvelle demande', 'Nouvelle demande de service de nettoyage', false, 'high', NOW()),
('550e8400-e29b-41d4-a716-446655440006', 'service', 'Demande acceptée', 'Votre demande de service a été acceptée', true, 'medium', NOW()),

('550e8400-e29b-41d4-a716-446655440007', 'service', 'Nouvelle demande', 'Nouvelle demande de service d''électricité', false, 'high', NOW());

-- 2. Insérer des messages de test
INSERT INTO messages (sender_id, receiver_id, subject, content, is_read, message_type, created_at) VALUES
-- Messages entre voyageur et admin
('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'Question sur ma réservation', 'Bonjour, j''ai une question concernant ma réservation #res-001. Pouvez-vous m''aider ?', false, 'support', NOW()),
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 'Réponse à votre question', 'Bonjour, je vais examiner votre réservation et vous répondre rapidement.', true, 'support', NOW()),

-- Messages entre propriétaire et admin
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Problème avec un invité', 'Bonjour, j''ai un problème avec un invité qui ne respecte pas les règles. Que puis-je faire ?', false, 'support', NOW()),
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'Support pour votre problème', 'Bonjour, je vais vous aider à résoudre ce problème. Contactez-moi directement.', true, 'support', NOW()),

-- Messages entre prestataire et admin
('550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440001', 'Demande de service', 'Bonjour, j''aimerais proposer mes services de nettoyage sur votre plateforme.', false, 'business', NOW()),
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440006', 'Validation de votre profil', 'Votre profil de prestataire a été validé. Bienvenue sur la plateforme !', true, 'business', NOW()),

-- Messages entre voyageurs
('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440005', 'Recommandation', 'Salut ! Je recommande vivement la Villa Paradis, c''était parfait !', false, 'general', NOW());

-- 3. Vérifier que les données ont été insérées
SELECT 
    'Données de test insérées avec succès !' as message,
    'notifications' as table_name,
    COUNT(*) as count
FROM notifications
UNION ALL
SELECT 
    'Données de test insérées avec succès !' as message,
    'messages' as table_name,
    COUNT(*) as count
FROM messages;

-- 4. Afficher un résumé des données
SELECT 
    'Résumé des données créées' as section,
    'Notifications' as type,
    COUNT(*) as total,
    COUNT(CASE WHEN is_read = false THEN 1 END) as non_lues
FROM notifications
UNION ALL
SELECT 
    'Résumé des données créées' as section,
    'Messages' as type,
    COUNT(*) as total,
    COUNT(CASE WHEN is_read = false THEN 1 END) as non_lus
FROM messages;
