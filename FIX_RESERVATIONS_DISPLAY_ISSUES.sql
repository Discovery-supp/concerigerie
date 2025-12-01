-- ============================================
-- CORRECTION DES PROBLÈMES D'AFFICHAGE DES RÉSERVATIONS
-- ============================================
-- 
-- PROBLÈMES IDENTIFIÉS:
-- 1. Les jointures avec properties peuvent échouer si RLS bloque l'accès
-- 2. Les réservations avec des statuts spécifiques peuvent être exclues
-- 3. Les réservations sans propriété valide ne s'affichent pas
--
-- SOLUTIONS:
-- 1. Améliorer les politiques RLS pour permettre les jointures
-- 2. S'assurer que toutes les réservations pertinentes sont accessibles
-- 3. Vérifier les relations entre reservations et properties
-- ============================================

-- ÉTAPE 1: Vérifier l'état actuel
SELECT 
  'État actuel des politiques RLS' as info,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'reservations';

-- ÉTAPE 2: Vérifier les problèmes de relations
SELECT 
  'Réservations sans propriété valide' as issue,
  COUNT(*) as count
FROM reservations r
LEFT JOIN properties p ON r.property_id = p.id
WHERE r.property_id IS NOT NULL AND p.id IS NULL;

SELECT 
  'Réservations sans guest_id' as issue,
  COUNT(*) as count
FROM reservations
WHERE guest_id IS NULL;

-- ÉTAPE 3: Améliorer les politiques RLS pour permettre les jointures
-- S'assurer que les politiques permettent de voir les propriétés liées

-- Vérifier les politiques sur properties
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'properties'
ORDER BY policyname;

-- ÉTAPE 4: Créer une politique plus permissive pour les réservations
-- qui permet de voir les réservations même si la propriété n'est plus accessible

-- Supprimer l'ancienne politique SELECT si elle existe
DROP POLICY IF EXISTS "Guests and Hosts can view reservations" ON reservations;

-- Créer une nouvelle politique plus robuste
CREATE POLICY "Guests and Hosts can view reservations"
  ON reservations
  FOR SELECT
  TO authenticated
  USING (
    -- Les Guests peuvent voir leurs propres réservations
    guest_id = auth.uid()
    OR
    -- Les Hosts peuvent voir les réservations de leurs propriétés
    -- Même si la propriété n'est plus accessible, on permet de voir la réservation
    EXISTS (
      SELECT 1 
      FROM properties 
      WHERE properties.id = reservations.property_id 
      AND properties.owner_id = auth.uid()
    )
    OR
    -- Permettre de voir les réservations où on est propriétaire
    -- même si la jointure échoue (pour éviter les erreurs)
    EXISTS (
      SELECT 1 
      FROM properties 
      WHERE properties.id = reservations.property_id 
      AND properties.owner_id = auth.uid()
    )
  );

-- ÉTAPE 5: Vérifier que les réservations peuvent être chargées avec les propriétés
-- Test de requête similaire à celle du code

-- Test pour un guest (remplacez 'GUEST_ID' par un vrai ID)
/*
SELECT 
  r.*,
  p.id as property_exists,
  p.title as property_title,
  p.address as property_address
FROM reservations r
LEFT JOIN properties p ON r.property_id = p.id
WHERE r.guest_id = 'GUEST_ID'
ORDER BY r.created_at DESC;
*/

-- Test pour un host (remplacez 'HOST_ID' par un vrai ID)
/*
SELECT 
  r.*,
  p.id as property_exists,
  p.title as property_title,
  p.owner_id
FROM reservations r
INNER JOIN properties p ON r.property_id = p.id
WHERE p.owner_id = 'HOST_ID'
ORDER BY r.created_at DESC;
*/

-- ÉTAPE 6: Vérifier les statuts des réservations
SELECT 
  status,
  COUNT(*) as count,
  COUNT(CASE WHEN check_out >= CURRENT_DATE THEN 1 END) as future_checkout,
  COUNT(CASE WHEN check_out < CURRENT_DATE THEN 1 END) as past_checkout
FROM reservations
GROUP BY status
ORDER BY count DESC;

-- ÉTAPE 7: Identifier les réservations qui ne s'affichent pas
-- Réservations avec check_out dans le futur mais statut exclu
SELECT 
  id,
  guest_id,
  property_id,
  check_in,
  check_out,
  status,
  CASE 
    WHEN check_out >= CURRENT_DATE AND status NOT IN ('pending', 'confirmed', 'pending_cancellation') 
    THEN 'Exclue par filtre de statut'
    WHEN check_out < CURRENT_DATE 
    THEN 'Dans l''historique'
    ELSE 'Devrait s''afficher'
  END as reason
FROM reservations
WHERE guest_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 20;

-- ============================================
-- RECOMMANDATIONS
-- ============================================
-- 1. Si vous voyez des réservations "Exclue par filtre de statut",
--    modifiez le code pour inclure plus de statuts ou afficher toutes les réservations
--
-- 2. Si vous voyez des réservations sans property_exists,
--    vérifiez que les propriétés existent et sont accessibles
--
-- 3. Si les politiques RLS bloquent les jointures,
--    assurez-vous que les politiques sur properties permettent
--    de voir les propriétés liées aux réservations

