-- ============================================
-- TEST ET CORRECTION DE L'AFFICHAGE DES RÉSERVATIONS
-- ============================================
-- 
-- Ce script:
-- 1. Vérifie que les politiques RLS sont correctement configurées
-- 2. Teste que les Guests peuvent voir leurs réservations
-- 3. Teste que les Hosts peuvent voir les réservations de leurs propriétés
-- 4. Affiche des informations de diagnostic
--
-- ============================================

-- ÉTAPE 1: Vérifier que RLS est activé sur reservations
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'reservations';

-- ÉTAPE 2: Vérifier les politiques RLS existantes
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'reservations'
ORDER BY policyname, cmd;

-- ÉTAPE 3: Vérifier qu'il y a des réservations dans la base
SELECT 
  COUNT(*) as total_reservations,
  COUNT(DISTINCT guest_id) as unique_guests,
  COUNT(DISTINCT property_id) as unique_properties,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
  COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_count,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count
FROM reservations;

-- ÉTAPE 4: Afficher quelques exemples de réservations (sans données sensibles)
SELECT 
  id,
  property_id,
  guest_id,
  check_in,
  check_out,
  status,
  payment_status,
  total_amount,
  created_at
FROM reservations
ORDER BY created_at DESC
LIMIT 10;

-- ÉTAPE 5: Vérifier les relations entre reservations et properties
SELECT 
  r.id as reservation_id,
  r.guest_id,
  r.property_id,
  r.status,
  p.id as property_exists,
  p.owner_id,
  p.is_published
FROM reservations r
LEFT JOIN properties p ON r.property_id = p.id
LIMIT 10;

-- ÉTAPE 6: Vérifier les relations entre reservations et user_profiles (guests)
SELECT 
  r.id as reservation_id,
  r.guest_id,
  r.status,
  up.id as guest_profile_exists,
  up.user_type as guest_type
FROM reservations r
LEFT JOIN user_profiles up ON r.guest_id = up.id
LIMIT 10;

-- ÉTAPE 7: Compter les réservations par guest
SELECT 
  guest_id,
  COUNT(*) as reservation_count,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
FROM reservations
WHERE guest_id IS NOT NULL
GROUP BY guest_id
ORDER BY reservation_count DESC
LIMIT 10;

-- ÉTAPE 8: Compter les réservations par propriétaire (via properties)
SELECT 
  p.owner_id,
  COUNT(*) as reservation_count,
  COUNT(CASE WHEN r.status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN r.status = 'confirmed' THEN 1 END) as confirmed,
  COUNT(CASE WHEN r.status = 'completed' THEN 1 END) as completed
FROM reservations r
JOIN properties p ON r.property_id = p.id
WHERE p.owner_id IS NOT NULL
GROUP BY p.owner_id
ORDER BY reservation_count DESC
LIMIT 10;

-- ============================================
-- DIAGNOSTIC DES PROBLÈMES POTENTIELS
-- ============================================

-- Vérifier s'il y a des réservations sans guest_id
SELECT 
  COUNT(*) as reservations_without_guest
FROM reservations
WHERE guest_id IS NULL;

-- Vérifier s'il y a des réservations sans property_id
SELECT 
  COUNT(*) as reservations_without_property
FROM reservations
WHERE property_id IS NULL;

-- Vérifier s'il y a des réservations avec des property_id qui n'existent pas
SELECT 
  COUNT(*) as reservations_with_invalid_property
FROM reservations r
LEFT JOIN properties p ON r.property_id = p.id
WHERE r.property_id IS NOT NULL AND p.id IS NULL;

-- Vérifier s'il y a des réservations avec des guest_id qui n'existent pas dans user_profiles
SELECT 
  COUNT(*) as reservations_with_invalid_guest
FROM reservations r
LEFT JOIN user_profiles up ON r.guest_id = up.id
WHERE r.guest_id IS NOT NULL AND up.id IS NULL;

-- ============================================
-- RECOMMANDATIONS
-- ============================================
-- Si vous voyez:
-- 1. RLS non activé → Exécutez FIX_RESERVATIONS_RLS.sql
-- 2. Pas de politiques RLS → Exécutez FIX_RESERVATIONS_RLS.sql
-- 3. Aucune réservation → Créez des réservations de test
-- 4. Réservations sans guest_id ou property_id → Corrigez les données
-- 5. Réservations avec IDs invalides → Corrigez les relations

