-- Script de vérification de la table consultation_messages
-- Exécutez ce script après avoir créé la table pour vérifier qu'elle fonctionne

-- Vérifier que la table existe
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name = 'consultation_messages';

-- Vérifier la structure de la table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'consultation_messages'
ORDER BY ordinal_position;

-- Vérifier les politiques RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'consultation_messages';

-- Vérifier les index
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'consultation_messages';

-- Compter les messages existants
SELECT COUNT(*) as total_messages FROM consultation_messages;

-- Afficher les derniers messages
SELECT 
    id,
    first_name,
    last_name,
    email,
    subject,
    status,
    created_at
FROM consultation_messages 
ORDER BY created_at DESC 
LIMIT 5;





