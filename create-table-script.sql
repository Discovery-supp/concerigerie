-- Script pour créer la table consultation_messages dans Supabase
-- Copiez et exécutez ce script dans l'éditeur SQL de votre projet Supabase

-- Vérifier si la table existe déjà
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'consultation_messages') THEN
        -- Créer la table consultation_messages
        CREATE TABLE consultation_messages (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(20) NOT NULL,
            address TEXT,
            subject VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Créer les index pour de meilleures performances
        CREATE INDEX idx_consultation_messages_created_at ON consultation_messages(created_at DESC);
        CREATE INDEX idx_consultation_messages_status ON consultation_messages(status);
        CREATE INDEX idx_consultation_messages_email ON consultation_messages(email);

        -- Activer Row Level Security
        ALTER TABLE consultation_messages ENABLE ROW LEVEL SECURITY;

        -- Créer les politiques de sécurité
        CREATE POLICY "Allow public to insert consultation messages" ON consultation_messages
            FOR INSERT WITH CHECK (true);

        CREATE POLICY "Allow authenticated users to read consultation messages" ON consultation_messages
            FOR SELECT USING (auth.role() = 'authenticated');

        CREATE POLICY "Allow authenticated users to update consultation messages" ON consultation_messages
            FOR UPDATE USING (auth.role() = 'authenticated');

        -- Créer la fonction pour mettre à jour updated_at
        CREATE OR REPLACE FUNCTION update_consultation_messages_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        -- Créer le trigger pour mettre à jour automatiquement updated_at
        CREATE TRIGGER update_consultation_messages_updated_at
            BEFORE UPDATE ON consultation_messages
            FOR EACH ROW
            EXECUTE FUNCTION update_consultation_messages_updated_at();

        RAISE NOTICE 'Table consultation_messages créée avec succès !';
    ELSE
        RAISE NOTICE 'Table consultation_messages existe déjà.';
    END IF;
END $$;





