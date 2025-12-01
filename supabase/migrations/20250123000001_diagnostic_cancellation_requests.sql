-- Script de diagnostic pour les demandes d'annulation
-- Ce script permet de vérifier l'état de la base de données concernant les demandes d'annulation

-- 1. Vérifier si la contrainte CHECK inclut 'pending_cancellation'
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'reservations'::regclass
  AND conname LIKE '%status%'
  AND contype = 'c';

-- 2. Vérifier les statuts actuels des réservations
SELECT 
  status,
  COUNT(*) as count
FROM reservations
GROUP BY status
ORDER BY count DESC;

-- 3. Vérifier les réservations avec le statut 'pending_cancellation'
SELECT 
  id,
  status,
  payment_status,
  check_in,
  check_out,
  total_amount,
  cancellation_reason,
  created_at,
  updated_at
FROM reservations
WHERE status = 'pending_cancellation'
ORDER BY created_at DESC;

-- 4. Vérifier si la colonne cancellation_reason existe
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'reservations'
  AND column_name IN ('cancellation_reason', 'cancelled_at', 'status');

-- 5. Vérifier la structure de la table notifications
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- 6. Vérifier les notifications (si la colonne 'type' existe)
-- IMPORTANT: Exécutez d'abord la requête #5 pour voir la structure de la table notifications
-- Si la colonne 'type' n'existe pas, cette requête échouera
-- Dans ce cas, adaptez la requête selon les colonnes disponibles dans votre table

-- Option A: Si votre table a une colonne 'type'
-- Décommentez la ligne suivante si la colonne 'type' existe:
/*
SELECT 
  id,
  user_id,
  type,
  title,
  message,
  is_read,
  created_at
FROM notifications
WHERE type = 'cancellation_request'
ORDER BY created_at DESC
LIMIT 10;
*/

-- Option B: Si votre table n'a pas de colonne 'type', utilisez cette requête pour voir toutes les notifications:
SELECT 
  id,
  user_id,
  title,
  message,
  is_read,
  created_at
FROM notifications
ORDER BY created_at DESC
LIMIT 20;

-- 7. Vérifier les admins qui devraient recevoir les notifications
SELECT 
  id,
  first_name,
  last_name,
  email,
  user_type
FROM user_profiles
WHERE user_type IN ('admin', 'super_admin');

