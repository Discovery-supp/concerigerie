# Création de Comptes Admin par Super Admin

## 📋 Vue d'ensemble

Cette fonctionnalité permet uniquement aux **super administrateurs** de créer de nouveaux comptes administrateurs dans l'application.

## 🔐 Sécurité

- **Seuls les super_admin peuvent créer des comptes admin**
- La vérification se fait à deux niveaux :
  1. Frontend : Vérification du `user_type` dans le composant
  2. Backend : Vérification via `auth.uid()` (à implémenter dans une Edge Function)

## 🚀 Configuration

### Option 1 : Développement (non recommandé pour production)

Pour le développement, vous pouvez ajouter la clé service_role dans votre `.env` :

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # ⚠️ Uniquement en développement
```

⚠️ **ATTENTION** : Ne jamais exposer la clé `SERVICE_ROLE_KEY` côté client en production ! Cette clé contourne toutes les politiques RLS.

### Option 2 : Production (Recommandé)

Pour la production, créez une **Edge Function Supabase** qui utilise la clé service_role côté serveur.

1. Créez une Edge Function dans votre projet Supabase
2. Utilisez la clé service_role dans la fonction
3. Appelez cette fonction depuis le frontend

Exemple d'Edge Function (`supabase/functions/create-admin/index.ts`) :

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  try {
    const { email, password, first_name, last_name, phone } = await req.json()
    
    // Créer un client avec service_role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    
    // Créer l'utilisateur
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name, last_name }
    })
    
    if (authError) throw authError
    
    // Créer le profil
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email,
        first_name,
        last_name,
        phone: phone || null,
        user_type: 'admin'
      })
    
    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw profileError
    }
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
```

## 📝 Migration de la Base de Données

Exécutez la migration pour ajouter le type `super_admin` :

```bash
# Dans l'éditeur SQL de Supabase
```

Ou exécutez le fichier : `supabase/migrations/20250116000001_add_super_admin_type.sql`

## 👤 Créer le Premier Super Admin

Pour créer le premier super admin, exécutez cette requête SQL :

```sql
-- Remplacer 'admin@test.com' par l'email de votre compte admin existant
UPDATE user_profiles 
SET user_type = 'super_admin'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'admin@test.com'
);
```

## 🎯 Utilisation

1. Connectez-vous avec un compte `super_admin`
2. Allez dans le dashboard administrateur
3. Cliquez sur l'onglet "Créer Admin" (visible uniquement pour super_admin)
4. Remplissez le formulaire
5. Le compte admin sera créé automatiquement

## ✅ Vérifications Effectuées

- ✅ Vérification que l'utilisateur actuel est `super_admin`
- ✅ Validation des champs du formulaire
- ✅ Création du compte dans `auth.users`
- ✅ Création du profil dans `user_profiles` avec `user_type = 'admin'`
- ✅ Gestion des erreurs (suppression du compte auth si le profil échoue)

## 🔒 Sécurité Recommandée

Pour une sécurité optimale en production :

1. ✅ Créez une Edge Function Supabase
2. ✅ Ajoutez une vérification RLS supplémentaire
3. ✅ Limitez le nombre de créations par super_admin
4. ✅ Ajoutez un log d'audit des créations
5. ❌ Ne jamais exposer `SERVICE_ROLE_KEY` côté client

## 📚 Fichiers Créés

- `src/components/Dashboard/CreateAdminAccount.tsx` - Composant de création
- `src/lib/supabase-admin.ts` - Client admin avec service_role
- `supabase/migrations/20250116000001_add_super_admin_type.sql` - Migration pour super_admin
- `src/components/Dashboard/AdminDashboard.tsx` - Mis à jour avec l'onglet création

## 🐛 Dépannage

**Erreur : "Clé service_role non configurée"**
- Solution : Ajoutez `VITE_SUPABASE_SERVICE_ROLE_KEY` dans votre `.env` (dev uniquement)
- OU créez une Edge Function Supabase pour la production

**Erreur : "Seuls les super administrateurs peuvent créer des comptes admin"**
- Solution : Vérifiez que votre compte a `user_type = 'super_admin'` dans `user_profiles`

**Le bouton "Créer Admin" n'apparaît pas**
- Solution : Vérifiez que vous êtes connecté avec un compte `super_admin`

