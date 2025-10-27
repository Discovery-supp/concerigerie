-- Script pour vérifier les types de colonnes dans les tables
-- Exécutez ce script pour comprendre la structure de vos tables

-- 1. Vérifier la structure de la table properties
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'properties' 
ORDER BY ordinal_position;

-- 2. Vérifier la structure de la table reservations
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'reservations' 
ORDER BY ordinal_position;

-- 3. Vérifier la structure de la table user_profiles
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- 4. Vérifier les colonnes JSONB spécifiquement
SELECT 
    table_name,
    column_name, 
    data_type
FROM information_schema.columns 
WHERE data_type = 'jsonb'
ORDER BY table_name, column_name;

-- 5. Vérifier les colonnes de type array
SELECT 
    table_name,
    column_name, 
    data_type
FROM information_schema.columns 
WHERE data_type LIKE '%[]%'
ORDER BY table_name, column_name;


