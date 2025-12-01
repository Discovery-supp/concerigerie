/*
  # Attribution des rôles aux comptes utilisateurs
  
  Ce script assigne les rôles appropriés aux comptes de test :
  - admin@test.com → admin
  - host1@test.com → owner
  - guest1@test.com → traveler
  - service1@test.com → provider
*/

-- Fonction pour mettre à jour ou créer un profil utilisateur
DO $$
DECLARE
  user_id_val uuid;
BEGIN
  -- Admin
  SELECT id INTO user_id_val FROM auth.users WHERE email = 'admin@test.com';
  IF user_id_val IS NOT NULL THEN
    INSERT INTO user_profiles (id, email, first_name, last_name, user_type)
    SELECT id, email, 'Admin', 'Test', 'admin'
    FROM auth.users WHERE id = user_id_val
    ON CONFLICT (id) DO UPDATE 
    SET email = EXCLUDED.email,
        user_type = 'admin',
        first_name = COALESCE(user_profiles.first_name, 'Admin'),
        last_name = COALESCE(user_profiles.last_name, 'Test'),
        updated_at = now();
    RAISE NOTICE 'Profil admin créé/mis à jour pour admin@test.com';
  ELSE
    RAISE NOTICE 'Utilisateur admin@test.com non trouvé dans auth.users';
  END IF;

  -- Propriétaire
  SELECT id INTO user_id_val FROM auth.users WHERE email = 'host1@test.com';
  IF user_id_val IS NOT NULL THEN
    INSERT INTO user_profiles (id, email, first_name, last_name, user_type)
    SELECT id, email, 'Host', 'Test', 'owner'
    FROM auth.users WHERE id = user_id_val
    ON CONFLICT (id) DO UPDATE 
    SET email = EXCLUDED.email,
        user_type = 'owner',
        first_name = COALESCE(user_profiles.first_name, 'Host'),
        last_name = COALESCE(user_profiles.last_name, 'Test'),
        updated_at = now();
    RAISE NOTICE 'Profil owner créé/mis à jour pour host1@test.com';
  ELSE
    RAISE NOTICE 'Utilisateur host1@test.com non trouvé dans auth.users';
  END IF;

  -- Voyageur
  SELECT id INTO user_id_val FROM auth.users WHERE email = 'guest1@test.com';
  IF user_id_val IS NOT NULL THEN
    INSERT INTO user_profiles (id, email, first_name, last_name, user_type)
    SELECT id, email, 'Guest', 'Test', 'traveler'
    FROM auth.users WHERE id = user_id_val
    ON CONFLICT (id) DO UPDATE 
    SET email = EXCLUDED.email,
        user_type = 'traveler',
        first_name = COALESCE(user_profiles.first_name, 'Guest'),
        last_name = COALESCE(user_profiles.last_name, 'Test'),
        updated_at = now();
    RAISE NOTICE 'Profil traveler créé/mis à jour pour guest1@test.com';
  ELSE
    RAISE NOTICE 'Utilisateur guest1@test.com non trouvé dans auth.users';
  END IF;

  -- Prestataire
  SELECT id INTO user_id_val FROM auth.users WHERE email = 'service1@test.com';
  IF user_id_val IS NOT NULL THEN
    INSERT INTO user_profiles (id, email, first_name, last_name, user_type)
    SELECT id, email, 'Service', 'Test', 'provider'
    FROM auth.users WHERE id = user_id_val
    ON CONFLICT (id) DO UPDATE 
    SET email = EXCLUDED.email,
        user_type = 'provider',
        first_name = COALESCE(user_profiles.first_name, 'Service'),
        last_name = COALESCE(user_profiles.last_name, 'Test'),
        updated_at = now();
    RAISE NOTICE 'Profil provider créé/mis à jour pour service1@test.com';
  ELSE
    RAISE NOTICE 'Utilisateur service1@test.com non trouvé dans auth.users';
  END IF;
END $$;

