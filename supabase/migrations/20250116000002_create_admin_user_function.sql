/*
  # Fonction RPC pour créer des comptes admin
  
  Cette fonction permet à un super_admin de créer des comptes admin via une fonction RPC sécurisée.
  Elle nécessite que l'utilisateur appelant soit un super_admin.
*/

-- Fonction pour créer un utilisateur admin (nécessite supabase.auth.admin côté client)
-- Cette fonction est une alternative si supabase.auth.admin n'est pas disponible
CREATE OR REPLACE FUNCTION create_admin_account(
  p_email text,
  p_password text,
  p_first_name text,
  p_last_name text,
  p_phone text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_result json;
BEGIN
  -- Vérifier que l'utilisateur appelant est un super_admin
  SELECT user_type INTO v_user_id
  FROM user_profiles
  WHERE id = auth.uid();
  
  -- Note: Cette vérification ne fonctionnera que si l'utilisateur est authentifié
  -- Pour une vraie sécurité, il faut vérifier via auth.uid()
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND user_type = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Seuls les super administrateurs peuvent créer des comptes admin';
  END IF;

  -- Cette fonction nécessite que la création soit faite via supabase.auth.admin
  -- côté client avec une clé service_role
  -- Ici, on retourne simplement un message d'instruction
  
  RETURN json_build_object(
    'message', 'Cette fonction nécessite l''utilisation de supabase.auth.admin avec une clé service_role',
    'note', 'Utilisez supabase.auth.admin.createUser() dans le composant React avec une clé service_role'
  );
END;
$$;

COMMENT ON FUNCTION create_admin_account IS 'Fonction pour créer des comptes admin (nécessite supabase.auth.admin côté client avec service_role key)';

