-- Script de test pour vérifier la table messages

-- Test 1: Vérifier que la table existe
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages')
        THEN '✅ Table messages existe'
        ELSE '❌ Table messages n''existe pas'
    END as test_table_exists;

-- Test 2: Vérifier la structure de la table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'messages'
ORDER BY ordinal_position;

-- Test 3: Vérifier les index
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'messages';

-- Test 4: Vérifier les politiques RLS
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'messages';

-- Test 5: Vérifier que RLS est activé
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'messages';

-- Test 6: Insérer un message de test (nécessite des utilisateurs existants)
-- Cette requête ne fonctionnera que si des utilisateurs existent dans user_profiles
DO $$
DECLARE
    test_sender_id UUID;
    test_receiver_id UUID;
BEGIN
    -- Récupérer deux utilisateurs existants
    SELECT id INTO test_sender_id FROM user_profiles LIMIT 1;
    SELECT id INTO test_receiver_id FROM user_profiles OFFSET 1 LIMIT 1;
    
    -- Si on a au moins un utilisateur, créer un message de test
    IF test_sender_id IS NOT NULL AND test_receiver_id IS NOT NULL THEN
        INSERT INTO messages (sender_id, receiver_id, subject, content)
        VALUES (test_sender_id, test_receiver_id, 'Test Message', 'Ceci est un message de test');
        
        RAISE NOTICE '✅ Message de test inséré avec succès';
    ELSE
        RAISE NOTICE '⚠️ Aucun utilisateur trouvé pour le test';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erreur lors de l''insertion du message de test: %', SQLERRM;
END $$;

-- Test 7: Compter les messages
SELECT 
    COUNT(*) as total_messages,
    COUNT(CASE WHEN is_read = false THEN 1 END) as unread_messages
FROM messages;

-- Test 8: Vérifier les contraintes de clé étrangère
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
AND tc.table_name = 'messages';


