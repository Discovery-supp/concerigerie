-- Créer la table des messages pour le système de messagerie
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL DEFAULT 'Message',
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);

-- Créer une fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour updated_at
CREATE TRIGGER trigger_update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_messages_updated_at();

-- Activer RLS (Row Level Security)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS
-- Les utilisateurs peuvent voir les messages où ils sont soit l'expéditeur soit le destinataire
CREATE POLICY "Users can view their own messages" ON messages
    FOR SELECT USING (
        auth.uid() = sender_id OR auth.uid() = receiver_id
    );

-- Les utilisateurs peuvent créer des messages
CREATE POLICY "Users can create messages" ON messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id
    );

-- Les utilisateurs peuvent mettre à jour les messages qu'ils ont reçus (pour marquer comme lu)
CREATE POLICY "Users can update received messages" ON messages
    FOR UPDATE USING (
        auth.uid() = receiver_id
    );

-- Les utilisateurs peuvent supprimer leurs propres messages
CREATE POLICY "Users can delete their own messages" ON messages
    FOR DELETE USING (
        auth.uid() = sender_id
    );

-- Commentaires sur la table
COMMENT ON TABLE messages IS 'Table pour stocker les messages entre utilisateurs';
COMMENT ON COLUMN messages.sender_id IS 'ID de l''utilisateur qui envoie le message';
COMMENT ON COLUMN messages.receiver_id IS 'ID de l''utilisateur qui reçoit le message';
COMMENT ON COLUMN messages.subject IS 'Sujet du message';
COMMENT ON COLUMN messages.content IS 'Contenu du message';
COMMENT ON COLUMN messages.is_read IS 'Indique si le message a été lu par le destinataire';


