# 🔍 Guide de Diagnostic - Problème d'Inscription

## 📋 Problème
Les données ne sont pas enregistrées dans la table `user_profiles` lors de l'inscription.

## ✅ Étapes de Diagnostic et Correction

### 1. **Exécuter le Script SQL Mis à Jour**

1. Ouvrez **Supabase Dashboard** → **SQL Editor**
2. Ouvrez le fichier `fix_user_profile_trigger.sql` (mis à jour)
3. **Copiez TOUT le contenu** du fichier
4. Collez dans le SQL Editor de Supabase
5. Cliquez sur **Run** (ou `Ctrl+Enter`)
6. Vérifiez qu'il n'y a **aucune erreur** dans les résultats

### 2. **Vérifier que le Trigger est Créé**

Exécutez cette requête dans Supabase SQL Editor :

```sql
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created_profile';
```

**Résultat attendu :** Vous devriez voir une ligne avec `on_auth_user_created_profile` qui se déclenche sur `INSERT` de `auth.users`.

### 3. **Vérifier que la Fonction Existe**

```sql
SELECT 
  routine_name, 
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'handle_new_user_profile';
```

**Résultat attendu :** Vous devriez voir `handle_new_user_profile` de type `FUNCTION`.

### 4. **Vérifier les Politiques RLS**

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'user_profiles';
```

**Résultat attendu :** Vous devriez voir au moins 3 politiques :
- `Users can insert their own profile` (INSERT)
- `Users can view their own profile` (SELECT)
- `Users can update their own profile` (UPDATE)

### 5. **Vérifier la Structure de la Table**

```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
ORDER BY ordinal_position;
```

**Résultat attendu :** La table doit avoir ces colonnes :
- `id` (uuid, NOT NULL)
- `email` (text, NOT NULL) ⚠️ **IMPORTANT**
- `first_name` (text, NOT NULL)
- `last_name` (text, NOT NULL)
- `phone` (text, NULLABLE)
- `user_type` (text, NOT NULL)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)

### 6. **Tester le Trigger Manuellement**

Pour tester si le trigger fonctionne, vous pouvez créer un utilisateur de test :

```sql
-- ATTENTION: Ceci est juste pour tester, supprimez l'utilisateur après
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'test@example.com',
  crypt('testpassword', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"firstName": "Test", "lastName": "User", "phone": "+1234567890", "userType": "traveler"}'::jsonb
);

-- Vérifier que le profil a été créé
SELECT * FROM user_profiles WHERE email = 'test@example.com';

-- Nettoyer: Supprimer l'utilisateur de test
DELETE FROM auth.users WHERE email = 'test@example.com';
```

### 7. **Vérifier les Logs Supabase**

1. Allez dans **Supabase Dashboard** → **Logs** → **Database**
2. Créez un nouveau compte depuis l'application
3. Regardez les logs pour voir s'il y a des erreurs SQL

**Erreurs courantes à chercher :**
- `null value in column "email"` → Le trigger n'inclut pas l'email
- `permission denied` → Problème de RLS
- `relation "user_profiles" does not exist` → La table n'existe pas
- `function handle_new_user_profile() does not exist` → La fonction n'existe pas

### 8. **Vérifier la Configuration Supabase Auth**

1. **Supabase Dashboard** → **Authentication** → **Providers** → **Email**
   - ✅ **Enable Email Provider** doit être activé

2. **Supabase Dashboard** → **Authentication** → **Settings** → **Email**
   - Pour le développement, vous pouvez désactiver "Confirm email" ou activer "Auto-confirm new users"

### 9. **Tester l'Inscription depuis l'Application**

1. Redémarrez votre serveur de développement (`npm run dev`)
2. Allez sur la page d'inscription
3. Créez un nouveau compte
4. Ouvrez la console du navigateur (F12) et regardez les logs
5. Vérifiez dans **Supabase Dashboard** → **Authentication** → **Users** que l'utilisateur a été créé
6. Vérifiez dans **Supabase Dashboard** → **Table Editor** → **user_profiles** que le profil existe

### 10. **Si le Problème Persiste**

Si après toutes ces étapes le problème persiste :

1. **Vérifiez les logs de la console du navigateur** pour voir l'erreur exacte
2. **Vérifiez les logs Supabase Database** pour voir l'erreur SQL exacte
3. **Vérifiez que vous avez bien exécuté le script SQL** (pas d'erreurs)
4. **Vérifiez que le trigger est bien créé** (étape 2)
5. **Vérifiez que les politiques RLS sont correctes** (étape 4)

## 🔧 Corrections Apportées

1. ✅ **Ajout de la colonne `email` dans le trigger** (obligatoire selon votre structure de table)
2. ✅ **Valeurs par défaut pour `first_name` et `last_name`** (pour éviter les erreurs NOT NULL)
3. ✅ **Amélioration des politiques RLS** (INSERT, SELECT, UPDATE)
4. ✅ **Amélioration du code d'inscription côté application** (fallback avec valeurs par défaut)
5. ✅ **Gestion d'erreur améliorée** dans le trigger SQL

## 📝 Notes Importantes

- Le trigger s'exécute **automatiquement** après chaque création d'utilisateur dans `auth.users`
- Si le trigger échoue, le code côté application tentera de créer le profil manuellement (fallback)
- Les politiques RLS permettent aux utilisateurs authentifiés de créer/modifier leur propre profil
- Le rôle `anon` a aussi les permissions nécessaires pour le fallback côté application

## 🚨 Erreurs Courantes

### Erreur: "null value in column 'email'"
**Cause :** Le trigger n'inclut pas l'email dans l'INSERT
**Solution :** Exécutez le script SQL mis à jour (`fix_user_profile_trigger.sql`)

### Erreur: "permission denied for table user_profiles"
**Cause :** Problème de RLS ou de permissions
**Solution :** Vérifiez les politiques RLS (étape 4) et exécutez la section 4 du script SQL

### Erreur: "Database error saving new user"
**Cause :** Le trigger échoue lors de la création de l'utilisateur
**Solution :** Vérifiez les logs Supabase Database pour voir l'erreur SQL exacte









