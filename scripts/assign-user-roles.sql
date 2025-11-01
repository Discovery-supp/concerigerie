-- Script SQL pour assigner les rôles aux utilisateurs
-- À exécuter dans l'éditeur SQL de Supabase

-- Vérifier et créer les profils pour chaque utilisateur
-- Admin
INSERT INTO user_profiles (id, email, first_name, last_name, user_type)
SELECT 
  au.id,
  au.email,
  'Admin',
  'Test',
  'admin'
FROM auth.users au
WHERE au.email = 'admin@test.com'
ON CONFLICT (id) DO UPDATE 
SET 
  email = EXCLUDED.email,
  user_type = 'admin',
  first_name = COALESCE(user_profiles.first_name, 'Admin'),
  last_name = COALESCE(user_profiles.last_name, 'Test'),
  updated_at = now();

-- Propriétaire
INSERT INTO user_profiles (id, email, first_name, last_name, user_type)
SELECT 
  au.id,
  au.email,
  'Host',
  'Test',
  'owner'
FROM auth.users au
WHERE au.email = 'host1@test.com'
ON CONFLICT (id) DO UPDATE 
SET 
  email = EXCLUDED.email,
  user_type = 'owner',
  first_name = COALESCE(user_profiles.first_name, 'Host'),
  last_name = COALESCE(user_profiles.last_name, 'Test'),
  updated_at = now();

-- Voyageur
INSERT INTO user_profiles (id, email, first_name, last_name, user_type)
SELECT 
  au.id,
  au.email,
  'Guest',
  'Test',
  'traveler'
FROM auth.users au
WHERE au.email = 'guest1@test.com'
ON CONFLICT (id) DO UPDATE 
SET 
  email = EXCLUDED.email,
  user_type = 'traveler',
  first_name = COALESCE(user_profiles.first_name, 'Guest'),
  last_name = COALESCE(user_profiles.last_name, 'Test'),
  updated_at = now();

-- Prestataire
INSERT INTO user_profiles (id, email, first_name, last_name, user_type)
SELECT 
  au.id,
  au.email,
  'Service',
  'Test',
  'provider'
FROM auth.users au
WHERE au.email = 'service1@test.com'
ON CONFLICT (id) DO UPDATE 
SET 
  email = EXCLUDED.email,
  user_type = 'provider',
  first_name = COALESCE(user_profiles.first_name, 'Service'),
  last_name = COALESCE(user_profiles.last_name, 'Test'),
  updated_at = now();

-- Vérification des rôles assignés
SELECT 
  au.email,
  up.user_type,
  up.first_name,
  up.last_name
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE au.email IN ('admin@test.com', 'host1@test.com', 'guest1@test.com', 'service1@test.com')
ORDER BY au.email;

