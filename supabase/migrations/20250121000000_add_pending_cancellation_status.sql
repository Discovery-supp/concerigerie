-- Migration pour ajouter le statut 'pending_cancellation' aux réservations
-- Ce statut permet aux voyageurs de faire une demande d'annulation qui sera traitée par l'admin

-- Supprimer la contrainte CHECK existante
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_status_check;

-- Recréer la contrainte avec le nouveau statut
ALTER TABLE reservations 
  ADD CONSTRAINT reservations_status_check 
  CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'refunded', 'pending_cancellation'));

