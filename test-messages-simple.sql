-- Test simple pour vérifier la table messages
-- Exécutez ce script après avoir créé la table

-- 1. Vérifier que la table existe
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages')
        THEN '✅ Table messages existe'
        ELSE '❌ Table messages n''existe pas'
    END as test_result;

-- 2. Vérifier les colonnes
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'messages'
ORDER BY ordinal_position;

-- 3. Vérifier les contraintes de clé étrangère
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'messages';

-- 4. Vérifier les politiques RLS
SELECT 
    policyname,
    permissive,
    cmd
FROM pg_policies 
WHERE tablename = 'messages';

-- 5. Test d'insertion (nécessite des utilisateurs existants)
-- Cette partie ne fonctionnera que si vous avez des utilisateurs dans user_profiles
DO $$
DECLARE
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM user_profiles;
    
    IF user_count >= 2 THEN
        RAISE NOTICE '✅ % utilisateurs trouvés - la table est prête pour les tests', user_count;
    ELSE
        RAISE NOTICE '⚠️ Seulement % utilisateur(s) trouvé(s) - créez plus d''utilisateurs pour tester', user_count;
    END IF;
END $$;


