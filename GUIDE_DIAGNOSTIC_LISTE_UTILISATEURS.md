# 🔍 Guide de Diagnostic - Liste des Utilisateurs Vide

## 📋 Problème
La liste des utilisateurs dans le dashboard admin est vide, même si des utilisateurs existent dans la base de données.

## ✅ Étapes de Diagnostic et Correction

### 1. **Exécuter le Script SQL Mis à Jour**

Le script SQL a été amélioré avec une fonction helper pour éviter les problèmes de récursion RLS. Exécutez-le :

1. Ouvrez **Supabase Dashboard** → **SQL Editor**
2. Ouvrez le fichier `fix_user_profile_trigger.sql`
3. **Copiez TOUT le contenu** du fichier
4. Collez dans le SQL Editor de Supabase
5. Cliquez sur **Run** (ou `Ctrl+Enter`)
6. Vérifiez qu'il n'y a **aucune erreur** dans les résultats

**Important :** Le script crée maintenant :
- **Fonction helper `is_admin_user`** : Utilise `SECURITY DEFINER` pour contourner RLS et vérifier si un utilisateur est admin
- **2 politiques séparées** pour la lecture :
  - `Users can view their own profile` : Permet à chaque utilisateur de voir son propre profil
  - `Admins can view all profiles` : Permet aux admins/super_admins de voir tous les profils (utilise la fonction helper)

### 2. **Vérifier les Logs de la Console du Navigateur**

1. Ouvrez votre application dans le navigateur
2. Ouvrez la **Console du navigateur** (F12 → onglet Console)
3. Connectez-vous en tant que super_admin
4. Allez sur l'onglet "Utilisateurs" du dashboard admin
5. Regardez les messages dans la console :
   - ✅ Si vous voyez `Utilisateurs chargés: X [...]` → Les utilisateurs sont chargés correctement
   - ❌ Si vous voyez `Erreur chargement utilisateurs:` → Il y a un problème (voir l'erreur ci-dessous)

### 3. **Vérifier que les Utilisateurs Existent dans Supabase**

1. Allez dans **Supabase Dashboard** → **Table Editor** → **user_profiles**
2. Vérifiez qu'il y a bien des utilisateurs dans la table
3. Notez le nombre d'utilisateurs

### 4. **Vérifier les Politiques RLS**

Exécutez cette requête dans Supabase SQL Editor :

```sql
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
WHERE tablename = 'user_profiles'
ORDER BY policyname;
```

**Résultat attendu :** Vous devriez voir au moins ces politiques :
- `Users can insert their own profile` (INSERT)
- `Users can view their own profile` (SELECT)
- `Admins can view all profiles` (SELECT) ⚠️ **IMPORTANT** - Utilise `public.is_admin_user(auth.uid())`
- `Users can update their own profile` (UPDATE)
- `Super admins can delete profiles` (DELETE)

**Vérifier aussi que la fonction `is_admin_user` existe :**
```sql
SELECT 
  routine_name, 
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'is_admin_user';
```

**Résultat attendu :** Vous devriez voir `is_admin_user` avec `security_type = 'DEFINER'`

### 5. **Tester la Requête Manuellement**

Exécutez cette requête dans Supabase SQL Editor (remplacez `VOTRE_USER_ID` par l'ID de votre super_admin) :

```sql
-- Récupérer votre user_id
SELECT id, email, user_type 
FROM user_profiles 
WHERE user_type = 'super_admin';

-- Tester la requête avec votre user_id
SET LOCAL role authenticated;
SET LOCAL request.jwt.claim.sub = 'VOTRE_USER_ID';

SELECT * FROM user_profiles ORDER BY created_at DESC;
```

Si cette requête retourne des résultats, le problème vient de l'application. Si elle ne retourne rien, le problème vient des politiques RLS.

### 6. **Vérifier le Type d'Utilisateur Actuel**

Dans la console du navigateur, après vous être connecté, exécutez :

```javascript
// Dans la console du navigateur (F12)
const { data } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('id', 'VOTRE_USER_ID')
  .single();
console.log('Mon profil:', data);
```

Vérifiez que `user_type` est bien `'super_admin'` ou `'admin'`.

### 7. **Solution Alternative : Désactiver Temporairement RLS (DÉVELOPPEMENT UNIQUEMENT)**

⚠️ **ATTENTION :** Ne faites cela QUE en développement, JAMAIS en production !

```sql
-- Désactiver RLS temporairement (DEV UNIQUEMENT)
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Tester si les utilisateurs apparaissent maintenant
-- Si oui, le problème vient des politiques RLS

-- Réactiver RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
```

### 8. **Vérifier les Permissions de la Table**

Exécutez cette requête pour vérifier les permissions :

```sql
SELECT 
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'user_profiles';
```

**Résultat attendu :** Vous devriez voir `authenticated` et `anon` avec les permissions `SELECT`, `INSERT`, `UPDATE`, `DELETE`.

## 🔧 Corrections Apportées

1. ✅ **Séparation des politiques RLS** : Une politique pour les utilisateurs normaux, une pour les admins
2. ✅ **Logs de débogage** : Ajout de logs dans la console pour voir ce qui se passe
3. ✅ **Message d'état vide** : Affichage d'un message clair quand la liste est vide
4. ✅ **Gestion des erreurs** : Affichage des détails d'erreur dans la console

## 🚨 Erreurs Courantes

### Erreur: "permission denied for table user_profiles"
**Cause :** Les politiques RLS bloquent l'accès
**Solution :** Exécutez le script SQL mis à jour (`fix_user_profile_trigger.sql`)

### Erreur: "new row violates row-level security policy"
**Cause :** La politique RLS ne permet pas la lecture
**Solution :** Vérifiez que la politique `Admins can view all profiles` existe et est correcte

### La liste est vide mais les utilisateurs existent dans Supabase
**Cause :** Problème de politique RLS ou l'utilisateur connecté n'est pas admin
**Solution :** 
1. Vérifiez que votre `user_type` est bien `'super_admin'` ou `'admin'`
2. Exécutez le script SQL mis à jour
3. Vérifiez les logs dans la console du navigateur

## 📝 Notes Importantes

- Les politiques RLS sont maintenant séparées pour plus de clarté
- Les admins et super_admins peuvent voir tous les profils grâce à la politique `Admins can view all profiles`
- Les logs dans la console du navigateur vous aideront à diagnostiquer le problème
- Si le problème persiste, vérifiez que votre utilisateur a bien le type `'super_admin'` ou `'admin'`

