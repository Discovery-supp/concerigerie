-- Script pour vérifier la structure de la table reviews
-- Exécutez ce script pour comprendre la vraie structure

-- 1. Vérifier la structure de la table reviews
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'reviews' 
ORDER BY ordinal_position;

-- 2. Vérifier si la table existe
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name = 'reviews';

-- 3. Afficher quelques lignes de la table pour voir la structure
SELECT * FROM reviews LIMIT 5;


