-- Script de nettoyage des données de test
-- ATTENTION: Ce script supprime TOUTES les données de test
-- Exécutez seulement si vous voulez recommencer

-- 1. Supprimer les notifications de test
DELETE FROM notifications WHERE id LIKE 'notif-%';

-- 2. Supprimer les demandes de service de test
DELETE FROM service_requests WHERE id LIKE 'serv-req-%';

-- 3. Supprimer les profils de prestataires de test
DELETE FROM service_providers WHERE user_id LIKE 'provider-%';

-- 4. Supprimer les profils d'hôtes de test
DELETE FROM host_profiles WHERE user_id LIKE 'owner-%';

-- 5. Supprimer les messages de test
DELETE FROM messages WHERE id LIKE 'msg-%';

-- 6. Supprimer les avis de test
DELETE FROM reviews WHERE id LIKE 'rev-%';

-- 7. Supprimer les réservations de test
DELETE FROM reservations WHERE id LIKE 'res-%';

-- 8. Supprimer les propriétés de test
DELETE FROM properties WHERE id LIKE 'prop-%';

-- 9. Supprimer les profils utilisateurs de test
DELETE FROM user_profiles WHERE id LIKE '%-001' OR id LIKE '%-002';

-- 10. Vérifier que tout a été supprimé
SELECT 
    'Nettoyage terminé' as status,
    'Toutes les données de test ont été supprimées' as message;


