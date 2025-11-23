# Guide pour corriger le problème d'inscription

## Problème
L'erreur "Database error saving new user" se produit lors de la création de compte car le trigger Supabase échoue.

## Solution en 3 étapes

### Étape 1 : Exécuter le script SQL dans Supabase

1. Allez sur [app.supabase.com](https://app.supabase.com)
2. Ouvrez votre projet `tuumjerhnhhimsxqmkjh`
3. Cliquez sur **SQL Editor** dans le menu latéral
4. Ouvrez le fichier `fix_user_profile_trigger.sql` dans votre projet
5. **Copiez tout le contenu** du fichier
6. **Collez-le** dans le SQL Editor de Supabase
7. Cliquez sur **Run** (ou Ctrl+Enter)

Ce script va :
- Supprimer tous les anciens triggers problématiques
- Créer un nouveau trigger robuste qui ne bloque jamais la création d'utilisateur
- Configurer les permissions correctement

### Étape 2 : Vérifier que ça fonctionne

1. Redémarrez votre serveur de développement (`npm run dev`)
2. Allez sur la page d'inscription
3. Créez un nouveau compte avec un email qui n'existe pas encore
4. Vous devriez voir le message de succès ✅

### Étape 3 : Vérifier dans Supabase

1. Dans Supabase, allez dans **Table Editor**
2. Sélectionnez la table `user_profiles`
3. Vous devriez voir votre nouvel utilisateur dans la liste

## Si ça ne fonctionne toujours pas

### Option A : Désactiver complètement le trigger (solution temporaire)

Exécutez ce SQL dans Supabase :

```sql
-- Désactiver le trigger temporairement
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
```

Le code côté application créera automatiquement le profil (fallback déjà implémenté).

### Option B : Vérifier les logs

1. Dans Supabase, allez dans **Logs** → **Database**
2. Tentez une inscription
3. Regardez les logs pour voir l'erreur exacte
4. Partagez l'erreur pour qu'on puisse la corriger

## Code amélioré

Le code côté application a été amélioré pour :
- Attendre que le trigger s'exécute
- Faire plusieurs tentatives pour récupérer le profil
- Créer le profil manuellement si le trigger échoue
- Ne jamais bloquer la création de compte même si le profil échoue










