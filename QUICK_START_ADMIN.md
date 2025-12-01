# 🚀 Démarrage Rapide - Création de Comptes Admin

## Option 1 : Edge Function (Recommandé - SÉCURISÉ) ⭐

L'Edge Function est déjà créée et prête à être déployée. C'est la méthode la plus sécurisée.

### Déployer l'Edge Function

```bash
# 1. Installer Supabase CLI (si nécessaire)
npm install -g supabase

# 2. Se connecter
supabase login

# 3. Lier votre projet
supabase link --project-ref YOUR_PROJECT_REF

# 4. Déployer la fonction
supabase functions deploy create-admin
```

✅ **C'est tout !** Aucune clé à configurer côté client. La fonction utilise automatiquement la clé SERVICE_ROLE_KEY côté serveur.

---

## Option 2 : Clé Service Role (Développement uniquement) ⚠️

⚠️ **ATTENTION** : Ne jamais utiliser cette méthode en production !

### Configuration

Ajoutez dans votre fichier `.env` à la racine du projet :

```env
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Où trouver la clé SERVICE_ROLE_KEY ?

1. Allez sur [supabase.com](https://supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Settings** → **API**
4. Copiez la **Service Role Key** (clé secrète, ne la partagez jamais !)

---

## ✅ Vérification

Une fois configuré (Option 1 ou 2) :

1. Connectez-vous avec un compte `super_admin`
2. Allez dans **Dashboard** → **Créer Admin**
3. Remplissez le formulaire
4. Le compte admin sera créé !

---

## 🎯 Créer le Premier Super Admin

Pour transformer votre compte admin en super_admin :

```sql
-- Exécutez dans l'éditeur SQL de Supabase
UPDATE user_profiles 
SET user_type = 'super_admin'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'admin@test.com'
);
```

Remplacez `admin@test.com` par l'email de votre compte admin.

---

## 📚 Documentation Complète

- `DEPLOY_EDGE_FUNCTION.md` - Guide détaillé du déploiement
- `README_ADMIN_CREATION.md` - Documentation complète

