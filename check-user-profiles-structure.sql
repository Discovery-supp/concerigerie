-- Script pour vérifier la structure de la table user_profiles
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- 1. Vérifier la structure de la table user_profiles
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- 2. Vérifier si la table existe
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name = 'user_profiles';

-- 3. Afficher quelques lignes de la table pour voir la structure
SELECT * FROM user_profiles LIMIT 5;


