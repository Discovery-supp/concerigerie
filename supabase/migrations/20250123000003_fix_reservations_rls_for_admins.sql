-- Migration pour corriger les politiques RLS sur la table reservations
-- Permettre aux admins de voir toutes les réservations

-- 1. Vérifier les politiques existantes
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
ORDER BY policyname;

-- 2. Supprimer les anciennes politiques restrictives pour les admins (si elles existent)
DROP POLICY IF EXISTS "Admins can view all reservations" ON reservations;
DROP POLICY IF EXISTS "Users can view their own reservations" ON reservations;
DROP POLICY IF EXISTS "Hosts can view their property reservations" ON reservations;

-- 3. Créer une fonction helper pour vérifier si un utilisateur est admin
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  user_type_value text;
BEGIN
  SELECT up.user_type INTO user_type_value
  FROM public.user_profiles up
  WHERE up.id = user_id;
  
  RETURN COALESCE(user_type_value IN ('admin', 'super_admin'), false);
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Donner les permissions d'exécution
GRANT EXECUTE ON FUNCTION public.is_admin_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_user(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin_user(uuid) TO service_role;

-- 4. Créer les politiques RLS pour les réservations

-- Politique pour les admins : peuvent voir TOUTES les réservations
CREATE POLICY "Admins can view all reservations"
  ON reservations
  FOR SELECT
  TO authenticated
  USING (
    is_admin_user(auth.uid())
  );

-- Politique pour les propriétaires : peuvent voir les réservations de leurs propriétés
CREATE POLICY "Hosts can view their property reservations"
  ON reservations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = reservations.property_id
        AND properties.owner_id = auth.uid()
    )
  );

-- Politique pour les voyageurs : peuvent voir leurs propres réservations
CREATE POLICY "Guests can view their own reservations"
  ON reservations
  FOR SELECT
  TO authenticated
  USING (
    guest_id = auth.uid()
  );

-- Politique pour les admins : peuvent modifier toutes les réservations
CREATE POLICY "Admins can update all reservations"
  ON reservations
  FOR UPDATE
  TO authenticated
  USING (
    is_admin_user(auth.uid())
  )
  WITH CHECK (
    is_admin_user(auth.uid())
  );

-- Politique pour les admins : peuvent supprimer toutes les réservations
CREATE POLICY "Admins can delete all reservations"
  ON reservations
  FOR DELETE
  TO authenticated
  USING (
    is_admin_user(auth.uid())
  );

-- 5. S'assurer que RLS est activé
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- 6. Vérifier que les politiques sont créées
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING: ' || qual::text
    ELSE 'Pas de condition USING'
  END as using_clause
FROM pg_policies
WHERE tablename = 'reservations'
ORDER BY policyname;

