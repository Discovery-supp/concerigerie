-- Permettre aux admins et super_admins de modifier le champ is_active de tous les utilisateurs
-- Cette migration doit être exécutée après la création de la colonne is_active

-- Créer une fonction helper pour vérifier si l'utilisateur est admin
-- Cette fonction utilise SECURITY DEFINER pour contourner RLS et éviter les boucles infinies
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_profiles
    WHERE id = auth.uid()
    AND user_type IN ('admin', 'super_admin')
  );
END;
$$;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Admins can update is_active" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update any user profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;

-- Créer une politique pour permettre aux admins de modifier n'importe quel profil utilisateur
-- (y compris le champ is_active)
CREATE POLICY "Admins can update any user profile"
ON user_profiles
FOR UPDATE
TO authenticated
USING (
  -- Utiliser la fonction helper pour éviter les boucles RLS
  public.is_admin_user()
  OR auth.uid() = id -- Permettre aussi de modifier son propre profil
)
WITH CHECK (
  -- Même condition pour WITH CHECK
  public.is_admin_user()
  OR auth.uid() = id
);

-- Créer une politique pour permettre aux admins de lire tous les profils
CREATE POLICY "Admins can read all profiles"
ON user_profiles
FOR SELECT
TO authenticated
USING (
  -- Utiliser la fonction helper pour éviter les boucles RLS
  public.is_admin_user()
  OR id = auth.uid() -- Permettre à l'utilisateur de voir son propre profil
);

