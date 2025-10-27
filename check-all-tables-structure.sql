-- Script de diagnostic complet pour toutes les tables
-- Exécutez ce script pour comprendre la structure de votre base de données

-- 1. Lister toutes les tables
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Vérifier la structure de user_profiles
SELECT 
    'user_profiles' as table_name,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- 3. Vérifier la structure de properties
SELECT 
    'properties' as table_name,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'properties' 
ORDER BY ordinal_position;

-- 4. Vérifier la structure de reservations
SELECT 
    'reservations' as table_name,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'reservations' 
ORDER BY ordinal_position;

-- 5. Vérifier la structure de reviews
SELECT 
    'reviews' as table_name,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'reviews' 
ORDER BY ordinal_position;

-- 6. Vérifier la structure de messages
SELECT 
    'messages' as table_name,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'messages' 
ORDER BY ordinal_position;

-- 7. Vérifier les colonnes JSONB
SELECT 
    table_name,
    column_name, 
    data_type
FROM information_schema.columns 
WHERE data_type = 'jsonb'
ORDER BY table_name, column_name;

-- 8. Vérifier les contraintes de clé étrangère
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;


