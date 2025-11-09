-- Script SQL pour corriger les relations de la table messages avec user_profiles
-- À exécuter dans l'éditeur SQL de Supabase

-- Vérifier si la table messages existe et sa structure actuelle
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'messages'
ORDER BY ordinal_position;

-- Vérifier les contraintes de clé étrangère existantes
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

-- Supprimer les anciennes contraintes si elles existent et pointent vers la mauvaise table
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_schema = 'public'
        AND table_name = 'messages'
        AND constraint_type = 'FOREIGN KEY'
        AND (constraint_name LIKE '%sender%' OR constraint_name LIKE '%receiver%')
    LOOP
        EXECUTE 'ALTER TABLE messages DROP CONSTRAINT IF EXISTS ' || quote_ident(constraint_record.constraint_name) || ' CASCADE';
        RAISE NOTICE 'Contrainte supprimée: %', constraint_record.constraint_name;
    END LOOP;
END $$;

-- Vérifier que user_profiles existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles'
    ) THEN
        RAISE EXCEPTION 'La table user_profiles n''existe pas. Veuillez d''abord créer cette table.';
    END IF;
    RAISE NOTICE 'La table user_profiles existe';
END $$;

-- Recréer les contraintes de clé étrangère avec les bons noms
-- Supprimer les colonnes si elles existent déjà avec de mauvaises références
DO $$
BEGIN
    -- Vérifier et corriger sender_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'messages' 
        AND column_name = 'sender_id'
    ) THEN
        -- Supprimer la contrainte existante si elle existe
        ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey CASCADE;
        -- Recréer la contrainte vers user_profiles
        ALTER TABLE messages 
        ADD CONSTRAINT messages_sender_id_fkey 
        FOREIGN KEY (sender_id) REFERENCES user_profiles(id) ON DELETE CASCADE;
        RAISE NOTICE 'Contrainte sender_id recréée vers user_profiles';
    ELSE
        -- Ajouter la colonne si elle n'existe pas
        ALTER TABLE messages 
        ADD COLUMN sender_id UUID NOT NULL;
        ALTER TABLE messages 
        ADD CONSTRAINT messages_sender_id_fkey 
        FOREIGN KEY (sender_id) REFERENCES user_profiles(id) ON DELETE CASCADE;
        RAISE NOTICE 'Colonne sender_id ajoutée avec contrainte vers user_profiles';
    END IF;

    -- Vérifier et corriger receiver_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'messages' 
        AND column_name = 'receiver_id'
    ) THEN
        -- Supprimer la contrainte existante si elle existe
        ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_receiver_id_fkey CASCADE;
        -- Recréer la contrainte vers user_profiles
        ALTER TABLE messages 
        ADD CONSTRAINT messages_receiver_id_fkey 
        FOREIGN KEY (receiver_id) REFERENCES user_profiles(id) ON DELETE CASCADE;
        RAISE NOTICE 'Contrainte receiver_id recréée vers user_profiles';
    ELSE
        -- Ajouter la colonne si elle n'existe pas
        ALTER TABLE messages 
        ADD COLUMN receiver_id UUID NOT NULL;
        ALTER TABLE messages 
        ADD CONSTRAINT messages_receiver_id_fkey 
        FOREIGN KEY (receiver_id) REFERENCES user_profiles(id) ON DELETE CASCADE;
        RAISE NOTICE 'Colonne receiver_id ajoutée avec contrainte vers user_profiles';
    END IF;
END $$;

-- Vérifier que les contraintes ont été créées correctement
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

