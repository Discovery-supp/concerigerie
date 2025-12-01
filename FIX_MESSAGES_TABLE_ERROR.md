# Résolution de l'erreur "column receiver_id does not exist"

## Problème
L'erreur `ERROR: 42703: column "receiver_id" does not exist` indique que la table `messages` n'a pas été créée correctement ou que la colonne `receiver_id` est manquante.

## Solutions

### Solution 1: Exécuter le script de correction complet

1. **Ouvrez l'éditeur SQL de Supabase** dans votre dashboard
2. **Copiez et exécutez** le contenu du fichier `fix-messages-table-complete.sql`
3. **Vérifiez** que la table est créée avec le script `test-messages-simple.sql`

### Solution 2: Vérifier manuellement la structure

Exécutez cette requête dans l'éditeur SQL de Supabase :

```sql
-- Vérifier si la table existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'messages'
) as table_exists;

-- Vérifier la structure de la table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'messages'
ORDER BY ordinal_position;
```

### Solution 3: Recréer la table depuis zéro

Si la table existe mais est corrompue :

```sql
-- Supprimer complètement la table
DROP TABLE IF EXISTS messages CASCADE;

-- Recréer la table
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

-- Activer RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Créer les politiques
CREATE POLICY "Users can view their own messages" ON messages
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create messages" ON messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update received messages" ON messages
    FOR UPDATE USING (auth.uid() = receiver_id);

CREATE POLICY "Users can delete their own messages" ON messages
    FOR DELETE USING (auth.uid() = sender_id);
```

## Vérification

Après avoir exécuté la correction, testez avec :

```sql
-- Test simple
SELECT 'Table messages OK' as status
WHERE EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'messages'
);
```

## Prévention

Pour éviter ce problème à l'avenir :

1. **Toujours vérifier** que les migrations s'exécutent correctement
2. **Utiliser les scripts de test** après chaque migration
3. **Vérifier la structure** des tables après création
4. **Sauvegarder** la base de données avant les modifications importantes

## Fichiers de correction fournis

- `fix-messages-table-complete.sql` - Script complet de correction
- `test-messages-simple.sql` - Script de test et vérification
- `verify-messages-table.sql` - Script de diagnostic avancé

## Support

Si le problème persiste :

1. Vérifiez que `user_profiles` existe et contient des données
2. Vérifiez les permissions de votre utilisateur Supabase
3. Consultez les logs Supabase pour plus de détails
4. Contactez le support Supabase si nécessaire


