-- Script pour vérifier et corriger le statut pending_cancellation
-- Ce script s'assure que la contrainte CHECK inclut bien 'pending_cancellation'

-- 1. Vérifier la contrainte actuelle
DO $$
DECLARE
  constraint_def text;
  has_pending_cancellation boolean;
BEGIN
  -- Récupérer la définition de la contrainte
  SELECT pg_get_constraintdef(oid) INTO constraint_def
  FROM pg_constraint
  WHERE conrelid = 'reservations'::regclass
    AND conname LIKE '%status%'
    AND contype = 'c'
  LIMIT 1;

  IF constraint_def IS NULL THEN
    RAISE NOTICE 'Aucune contrainte CHECK sur status trouvée. Création d''une nouvelle contrainte...';
    -- Créer la contrainte si elle n'existe pas
    ALTER TABLE reservations 
      ADD CONSTRAINT reservations_status_check 
      CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'refunded', 'pending_cancellation'));
    RAISE NOTICE 'Contrainte créée avec succès.';
  ELSE
    RAISE NOTICE 'Contrainte actuelle: %', constraint_def;
    
    -- Vérifier si pending_cancellation est dans la contrainte
    has_pending_cancellation := constraint_def LIKE '%pending_cancellation%';
    
    IF NOT has_pending_cancellation THEN
      RAISE NOTICE 'La contrainte ne contient pas pending_cancellation. Mise à jour...';
      
      -- Supprimer l'ancienne contrainte
      ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_status_check;
      
      -- Créer la nouvelle contrainte avec pending_cancellation
      ALTER TABLE reservations 
        ADD CONSTRAINT reservations_status_check 
        CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'refunded', 'pending_cancellation'));
      
      RAISE NOTICE 'Contrainte mise à jour avec succès.';
    ELSE
      RAISE NOTICE 'La contrainte contient déjà pending_cancellation. Aucune modification nécessaire.';
    END IF;
  END IF;
END $$;

-- 2. Vérifier les réservations avec le statut pending_cancellation
SELECT 
  'Réservations avec pending_cancellation' as info,
  COUNT(*) as count
FROM reservations
WHERE status = 'pending_cancellation';

-- 3. Afficher les réservations avec pending_cancellation
SELECT 
  id,
  status,
  check_in,
  check_out,
  total_amount,
  cancellation_reason,
  created_at
FROM reservations
WHERE status = 'pending_cancellation'
ORDER BY created_at DESC;

