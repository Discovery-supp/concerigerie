-- Script complet pour corriger la table messages
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- Étape 1: Supprimer la table messages si elle existe (avec toutes ses dépendances)
DROP TABLE IF EXISTS messages CASCADE;

-- Étape 2: Supprimer la fonction si elle existe
DROP FUNCTION IF EXISTS update_messages_updated_at() CASCADE;

-- Étape 3: Créer la table messages avec la structure correcte
CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL DEFAULT 'Message',
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Étape 4: Créer les index pour améliorer les performances
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_is_read ON messages(is_read);

-- Étape 5: Créer la fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Étape 6: Créer le trigger pour updated_at
CREATE TRIGGER trigger_update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_messages_updated_at();

-- Étape 7: Activer RLS (Row Level Security)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Étape 8: Créer les politiques RLS
CREATE POLICY "Users can view their own messages" ON messages
    FOR SELECT USING (
        auth.uid() = sender_id OR auth.uid() = receiver_id
    );

CREATE POLICY "Users can create messages" ON messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id
    );

CREATE POLICY "Users can update received messages" ON messages
    FOR UPDATE USING (
        auth.uid() = receiver_id
    );

CREATE POLICY "Users can delete their own messages" ON messages
    FOR DELETE USING (
        auth.uid() = sender_id
    );

-- Étape 9: Ajouter les commentaires
COMMENT ON TABLE messages IS 'Table pour stocker les messages entre utilisateurs';
COMMENT ON COLUMN messages.sender_id IS 'ID de l''utilisateur qui envoie le message';
COMMENT ON COLUMN messages.receiver_id IS 'ID de l''utilisateur qui reçoit le message';
COMMENT ON COLUMN messages.subject IS 'Sujet du message';
COMMENT ON COLUMN messages.content IS 'Contenu du message';
COMMENT ON COLUMN messages.is_read IS 'Indique si le message a été lu par le destinataire';

-- Étape 10: Vérifier que la table est bien créée
SELECT 
    'Table messages créée avec succès' as status,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'messages';

