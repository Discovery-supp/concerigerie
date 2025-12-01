-- Script SQL pour vérifier et corriger les politiques RLS de la table messages
-- À exécuter dans l'éditeur SQL de Supabase

-- Vérifier les politiques RLS existantes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'messages'
ORDER BY policyname;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
DROP POLICY IF EXISTS "Users can read their messages" ON messages;
DROP POLICY IF EXISTS "Users can create messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update received messages" ON messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;

-- Recréer les politiques RLS correctes
-- Les utilisateurs peuvent voir les messages où ils sont soit l'expéditeur soit le destinataire
CREATE POLICY "Users can view their own messages" ON messages
    FOR SELECT
    USING (
        auth.uid() = sender_id OR auth.uid() = receiver_id
    );

-- Les utilisateurs peuvent créer des messages
CREATE POLICY "Users can create messages" ON messages
    FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id
    );

-- Les utilisateurs peuvent mettre à jour les messages qu'ils ont reçus (pour marquer comme lu)
CREATE POLICY "Users can update received messages" ON messages
    FOR UPDATE
    USING (
        auth.uid() = receiver_id
    )
    WITH CHECK (
        auth.uid() = receiver_id
    );

-- Les utilisateurs peuvent supprimer leurs propres messages
CREATE POLICY "Users can delete their own messages" ON messages
    FOR DELETE
    USING (
        auth.uid() = sender_id
    );

-- Vérifier que RLS est activé
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Vérifier les contraintes de clé étrangère
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
    AND tc.table_name = 'messages'
ORDER BY tc.constraint_name;

-- Vérifier que la table messages a la bonne structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'messages'
ORDER BY ordinal_position;



