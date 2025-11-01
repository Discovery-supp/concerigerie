-- SCRIPT URGENT - Créer la table consultation_messages
-- Copiez TOUT ce script et exécutez-le dans l'éditeur SQL de Supabase

-- Supprimer la table si elle existe (pour éviter les conflits)
DROP TABLE IF EXISTS consultation_messages CASCADE;

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

-- Créer la politique pour permettre l'insertion publique
CREATE POLICY "Allow public to insert consultation messages" ON consultation_messages
    FOR INSERT WITH CHECK (true);

-- Créer la politique pour permettre la lecture aux utilisateurs authentifiés
CREATE POLICY "Allow authenticated users to read consultation messages" ON consultation_messages
    FOR SELECT USING (auth.role() = 'authenticated');

-- Créer la politique pour permettre la mise à jour aux utilisateurs authentifiés
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

-- Insérer un message de test pour vérifier que tout fonctionne
INSERT INTO consultation_messages (first_name, last_name, email, phone, subject, message)
VALUES ('Test', 'User', 'test@example.com', '+1234567890', 'Test de création de table', 'Ce message confirme que la table fonctionne correctement.');

-- Afficher un message de confirmation
SELECT 'SUCCESS: Table consultation_messages créée avec succès !' as result;

