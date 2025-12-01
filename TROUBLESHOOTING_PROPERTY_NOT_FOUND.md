# Guide de Dépannage - "Propriété non trouvée"

## Problème
Lors du clic sur une propriété, le message "Propriété non trouvée" s'affiche.

## Solutions à vérifier

### 1. Vérifier l'ID de la propriété dans l'URL

Quand vous cliquez sur une propriété, vérifiez l'URL dans la barre d'adresse :
- Elle devrait être : `/property/[ID-UUID]`
- Exemple : `/property/123e4567-e89b-12d3-a456-426614174000`

Si l'ID semble incorrect ou manquant, le problème vient du lien de navigation.

### 2. Vérifier dans la console du navigateur (F12)

Ouvrez la console (F12) et regardez les messages d'erreur. Vous devriez voir :
- `Recherche propriété avec ID: [ID]`
- Si erreur : `Erreur récupération propriété: ...`
- Le code d'erreur et le message détaillé

### 3. Vérifier dans Supabase que la propriété existe

Exécutez cette requête SQL dans Supabase :

```sql
-- Vérifier toutes les propriétés avec leurs IDs
SELECT 
  id,
  title,
  is_published,
  created_at,
  owner_id
FROM properties
ORDER BY created_at DESC
LIMIT 10;
```

### 4. Vérifier les politiques RLS (Row Level Security)

Les politiques RLS peuvent bloquer l'accès aux propriétés. Vérifiez avec :

```sql
-- Voir les politiques RLS pour la table properties
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'properties';
```

Si les politiques sont trop restrictives, vous pouvez temporairement désactiver RLS pour tester :

```sql
-- ATTENTION: À utiliser uniquement pour le débogage !
ALTER TABLE properties DISABLE ROW LEVEL SECURITY;
```

Puis réactivez-le après :

```sql
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
```

### 5. Créer une politique RLS pour permettre la lecture de toutes les propriétés publiées

Si RLS est activé et bloque l'accès, créez cette politique :

```sql
-- Permettre la lecture de toutes les propriétés publiées pour tous les utilisateurs
CREATE POLICY "Allow public to view published properties"
ON properties FOR SELECT
TO public
USING (is_published = true);

-- Permettre aux propriétaires de voir leurs propres propriétés (même non publiées)
CREATE POLICY "Allow owners to view their own properties"
ON properties FOR SELECT
TO authenticated
USING (auth.uid() = owner_id);
```

### 6. Vérifier les clés étrangères

Si la requête échoue à cause des jointures (`owner`, `reviews`), vérifiez les clés étrangères :

```sql
-- Vérifier les clés étrangères
SELECT
  tc.table_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'properties';
```

### 7. Tester la requête directement dans Supabase

Allez dans Supabase > Table Editor > SQL Editor et exécutez :

```sql
-- Remplacer [PROPERTY_ID] par l'ID réel de votre propriété
SELECT * 
FROM properties
WHERE id = '[PROPERTY_ID]';
```

Si cette requête ne retourne rien, la propriété n'existe pas ou RLS la bloque.

### 8. Vérifier que la propriété a bien été créée

```sql
-- Voir la dernière propriété créée
SELECT 
  id,
  title,
  is_published,
  owner_id,
  created_at
FROM properties
ORDER BY created_at DESC
LIMIT 1;
```

Copiez l'ID et testez avec l'URL : `/property/[ID-COPIÉ]`

## Messages d'erreur courants

### "PGRST116" ou "No rows returned"
- **Cause** : La propriété n'existe pas ou est bloquée par RLS
- **Solution** : Vérifiez que la propriété existe et ajustez les politiques RLS

### "relation 'reviews' does not exist"
- **Cause** : La table `reviews` n'existe pas
- **Solution** : Créez la table ou modifiez la requête pour ne pas inclure les reviews

### "permission denied for table properties"
- **Cause** : RLS bloque l'accès
- **Solution** : Créez une politique RLS appropriée (voir point 5)

## Commandes SQL utiles pour le débogage

```sql
-- Compter toutes les propriétés
SELECT COUNT(*) as total FROM properties;

-- Compter les propriétés publiées
SELECT COUNT(*) as published FROM properties WHERE is_published = true;

-- Voir toutes les propriétés avec leurs statuts
SELECT 
  id,
  title,
  is_published,
  CASE 
    WHEN is_published THEN 'Publiée'
    ELSE 'Non publiée'
  END as status
FROM properties
ORDER BY created_at DESC;
```

