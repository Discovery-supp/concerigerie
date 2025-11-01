-- Script de vérification des données de test
-- Exécutez ce script pour vérifier que tout a été créé correctement

-- 1. Vérifier les utilisateurs créés
SELECT 
    'Utilisateurs créés' as section,
    user_type,
    COUNT(*) as count,
    STRING_AGG(first_name || ' ' || last_name, ', ') as names
FROM user_profiles 
WHERE id LIKE '%001' OR id LIKE '%002'
GROUP BY user_type
ORDER BY user_type;

-- 2. Vérifier les propriétés créées
SELECT 
    'Propriétés créées' as section,
    COUNT(*) as total_properties,
    COUNT(CASE WHEN is_published = true THEN 1 END) as published_properties,
    STRING_AGG(title, ', ') as property_titles
FROM properties 
WHERE id LIKE 'prop-%';

-- 3. Vérifier les réservations créées
SELECT 
    'Réservations créées' as section,
    status,
    COUNT(*) as count,
    SUM(total_amount) as total_revenue
FROM reservations 
WHERE id LIKE 'res-%'
GROUP BY status;

-- 4. Vérifier les avis créés
SELECT 
    'Avis créés' as section,
    COUNT(*) as total_reviews,
    AVG(rating) as average_rating,
    COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star_reviews
FROM reviews 
WHERE id LIKE 'rev-%';

-- 5. Vérifier les messages créés
SELECT 
    'Messages créés' as section,
    COUNT(*) as total_messages,
    COUNT(CASE WHEN is_read = false THEN 1 END) as unread_messages,
    COUNT(CASE WHEN is_read = true THEN 1 END) as read_messages
FROM messages 
WHERE id LIKE 'msg-%';

-- 6. Vérifier les profils d'hôtes
SELECT 
    'Profils d\'hôtes' as section,
    COUNT(*) as total_host_profiles,
    COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_profiles
FROM host_profiles 
WHERE user_id LIKE 'owner-%';

-- 7. Vérifier les prestataires de service
SELECT 
    'Prestataires de service' as section,
    COUNT(*) as total_providers,
    COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_providers,
    AVG(rating) as average_rating
FROM service_providers 
WHERE user_id LIKE 'provider-%';

-- 8. Vérifier les demandes de service
SELECT 
    'Demandes de service' as section,
    status,
    COUNT(*) as count
FROM service_requests 
WHERE id LIKE 'serv-req-%'
GROUP BY status;

-- 9. Vérifier les notifications
SELECT 
    'Notifications créées' as section,
    type,
    COUNT(*) as count,
    COUNT(CASE WHEN is_read = false THEN 1 END) as unread_count
FROM notifications 
WHERE id LIKE 'notif-%'
GROUP BY type;

-- 10. Résumé général
SELECT 
    'RÉSUMÉ GÉNÉRAL' as section,
    'Données de test créées avec succès !' as status,
    'Vous pouvez maintenant tester tous les tableaux de bord' as next_step;


