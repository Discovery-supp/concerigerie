# Configuration Supabase Cloud

## 🚀 Étapes pour configurer Supabase Cloud

### 1. Créer un projet Supabase Cloud

1. **Allez sur [supabase.com](https://supabase.com)**
2. **Cliquez sur "Start your project"**
3. **Connectez-vous avec GitHub**
4. **Créez un nouveau projet** :
   - Nom du projet : `nzoo-immo-concerigerie`
   - Mot de passe de base de données : (choisissez un mot de passe fort)
   - Région : choisissez la plus proche de vous

### 2. Récupérer les credentials

1. **Dans votre dashboard Supabase**, allez dans **Settings > API**
2. **Copiez les valeurs suivantes** :
   - **Project URL** (ex: `https://your-project.supabase.co`)
   - **anon public** key (ex: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### 3. Configurer les variables d'environnement

1. **Créez un fichier `.env.local`** à la racine du projet :
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

2. **Remplacez les valeurs** par vos vraies credentials

### 4. Créer la table consultation_messages

1. **Allez dans l'éditeur SQL** de votre projet Supabase
2. **Copiez et exécutez** le script suivant :

```sql
-- Create consultation_messages table
CREATE TABLE IF NOT EXISTS consultation_messages (
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

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_consultation_messages_created_at ON consultation_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consultation_messages_status ON consultation_messages(status);
CREATE INDEX IF NOT EXISTS idx_consultation_messages_email ON consultation_messages(email);

-- Enable Row Level Security
ALTER TABLE consultation_messages ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert consultation messages (public access)
CREATE POLICY "Allow public to insert consultation messages" ON consultation_messages
    FOR INSERT WITH CHECK (true);

-- Create policy to allow authenticated users to read consultation messages
CREATE POLICY "Allow authenticated users to read consultation messages" ON consultation_messages
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to update consultation messages
CREATE POLICY "Allow authenticated users to update consultation messages" ON consultation_messages
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_consultation_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_consultation_messages_updated_at
    BEFORE UPDATE ON consultation_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_consultation_messages_updated_at();
```

### 5. Tester la configuration

1. **Redémarrez votre serveur de développement** :
```bash
npm run dev
```

2. **Allez sur http://localhost:5173/consultation**
3. **Remplissez le formulaire** et cliquez sur "Envoyer le message"
4. **Vérifiez dans Supabase** que le message a été enregistré :
   - Allez dans **Table Editor**
   - Sélectionnez la table `consultation_messages`
   - Vous devriez voir votre message

## ✅ Vérification

Si tout fonctionne correctement :
- ✅ Le formulaire s'envoie sans erreur
- ✅ Un message de succès s'affiche
- ✅ Le message apparaît dans la table Supabase
- ✅ Les données sont correctement formatées

## 🔧 Dépannage

### Erreur "Missing Supabase environment variables"
- Vérifiez que le fichier `.env.local` existe
- Vérifiez que les variables sont correctement nommées
- Redémarrez le serveur de développement

### Erreur de connexion à la base de données
- Vérifiez que l'URL et la clé API sont correctes
- Vérifiez que votre projet Supabase est actif
- Vérifiez que la table a été créée correctement

### Erreur de permissions
- Vérifiez que les politiques RLS sont correctement configurées
- Vérifiez que la politique d'insertion publique est active





