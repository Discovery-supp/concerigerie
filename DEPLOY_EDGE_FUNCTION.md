# Déploiement de l'Edge Function pour la Création de Comptes Admin

## 🎯 Solution Recommandée

Au lieu d'exposer la clé `SERVICE_ROLE_KEY` côté client, utilisez une **Edge Function Supabase** qui est sécurisée côté serveur.

## 📋 Étapes de Déploiement

### 1. Installer Supabase CLI (si pas déjà installé)

```bash
npm install -g supabase
```

### 2. Se connecter à Supabase

```bash
supabase login
```

### 3. Lier votre projet

```bash
supabase link --project-ref your-project-ref
```

### 4. Déployer la Edge Function

La fonction est déjà créée dans `supabase/functions/create-admin/index.ts`. Pour la déployer :

```bash
supabase functions deploy create-admin
```

### 5. Configurer les Secrets (automatique)

La clé `SERVICE_ROLE_KEY` est automatiquement disponible dans les Edge Functions via `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')`.

Aucune configuration supplémentaire n'est nécessaire ! ✅

## ✅ Après le Déploiement

Une fois déployée, l'Edge Function sera automatiquement utilisée au lieu de nécessiter la clé service_role côté client.

Le code essaie d'abord l'Edge Function, puis fait un fallback sur le client admin direct si la fonction n'est pas disponible.

## 🔍 Vérification

Pour vérifier que la fonction fonctionne :

1. Connectez-vous en tant que super_admin
2. Allez dans le dashboard → "Créer Admin"
3. Remplissez le formulaire
4. Le compte devrait être créé via l'Edge Function

## 🐛 Dépannage

**Erreur : "Edge Function non disponible"**
- Vérifiez que la fonction est déployée : `supabase functions list`
- Vérifiez les logs : `supabase functions logs create-admin`

**Erreur CORS**
- Les headers CORS sont déjà configurés dans la fonction
- Vérifiez que l'URL Supabase est correcte

**Erreur d'authentification**
- Vérifiez que vous êtes connecté en tant que super_admin
- Vérifiez que le token d'authentification est envoyé dans les headers

