-- Migration pour améliorer la gestion des annulations et le nettoyage automatique
-- 1. Ajouter la colonne cancellation_reason si elle n'existe pas
-- 2. Créer une fonction pour nettoyer automatiquement les réservations expirées
-- 3. Créer un trigger ou une fonction planifiée pour le nettoyage automatique

-- Ajouter la colonne cancellation_reason si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reservations' 
    AND column_name = 'cancellation_reason'
  ) THEN
    ALTER TABLE reservations ADD COLUMN cancellation_reason text;
  END IF;
END $$;

-- Ajouter la colonne cancelled_at si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reservations' 
    AND column_name = 'cancelled_at'
  ) THEN
    ALTER TABLE reservations ADD COLUMN cancelled_at timestamptz;
  END IF;
END $$;

-- Fonction pour nettoyer automatiquement les réservations expirées
-- Supprime les réservations qui:
-- 1. Ne sont pas confirmées (status != 'confirmed') ET après la date de fin
-- 2. OU en statut "payer" (payment_status = 'paid') ET après la date de fin
CREATE OR REPLACE FUNCTION cleanup_expired_reservations()
RETURNS TABLE(deleted_count integer, deleted_ids uuid[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_ids_array uuid[];
  deleted_count_var integer;
BEGIN
  -- Récupérer les IDs des réservations à supprimer
  -- Réservations non confirmées OU payées après la date de fin
  SELECT array_agg(id), count(*)
  INTO deleted_ids_array, deleted_count_var
  FROM reservations
  WHERE check_out < CURRENT_DATE
    AND (status != 'confirmed' OR payment_status = 'paid');

  -- Supprimer les réservations
  DELETE FROM reservations
  WHERE check_out < CURRENT_DATE
    AND (status != 'confirmed' OR payment_status = 'paid');

  -- Retourner le résultat
  RETURN QUERY SELECT 
    COALESCE(deleted_count_var, 0) as deleted_count,
    COALESCE(deleted_ids_array, ARRAY[]::uuid[]) as deleted_ids;
END;
$$;

-- Donner les permissions d'exécution
GRANT EXECUTE ON FUNCTION cleanup_expired_reservations() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_reservations() TO service_role;

-- Commentaire sur la fonction
COMMENT ON FUNCTION cleanup_expired_reservations() IS 
'Nettoie automatiquement les réservations expirées (non confirmées ou payées après la date de fin)';

-- Fonction pour récupérer tous les IDs des administrateurs (bypass RLS)
-- Cette fonction est utilisée pour envoyer des notifications aux admins
CREATE OR REPLACE FUNCTION get_all_admin_ids()
RETURNS TABLE(admin_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  -- Retourner tous les IDs des admins et super_admins
  -- SECURITY DEFINER permet de bypass RLS
  RETURN QUERY
  SELECT id
  FROM user_profiles
  WHERE user_type IN ('admin', 'super_admin');
END;
$$;

-- Donner les permissions d'exécution
GRANT EXECUTE ON FUNCTION get_all_admin_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_admin_ids() TO anon;
GRANT EXECUTE ON FUNCTION get_all_admin_ids() TO service_role;

-- Commentaire sur la fonction
COMMENT ON FUNCTION get_all_admin_ids() IS 
'Récupère tous les IDs des administrateurs (bypass RLS pour garantir la récupération)';

-- Optionnel: Créer un job planifié (nécessite pg_cron extension)
-- Pour activer, décommentez les lignes suivantes après avoir activé l'extension pg_cron
/*
SELECT cron.schedule(
  'cleanup-expired-reservations',
  '0 2 * * *', -- Tous les jours à 2h du matin
  $$SELECT cleanup_expired_reservations();$$
);
*/

