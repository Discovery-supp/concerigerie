# Attribution des rôles aux utilisateurs

Ce guide explique comment assigner les rôles aux comptes utilisateurs dans Supabase.

## Méthode 1 : Via l'éditeur SQL de Supabase (Recommandé)

1. Connectez-vous à votre dashboard Supabase
2. Allez dans **SQL Editor**
3. Copiez le contenu du fichier `scripts/assign-user-roles.sql`
4. Collez-le dans l'éditeur SQL
5. Cliquez sur **Run** pour exécuter le script

## Méthode 2 : Via l'interface Supabase

1. Connectez-vous à votre dashboard Supabase
2. Allez dans **Table Editor** → `user_profiles`
3. Pour chaque utilisateur :
   - Trouvez l'utilisateur par son email dans `auth.users`
   - Créez ou modifiez son profil dans `user_profiles`
   - Définissez le `user_type` approprié :
     - `admin` pour admin@test.com
     - `owner` pour host1@test.com
     - `traveler` pour guest1@test.com
     - `provider` pour service1@test.com

## Comptes à configurer

| Email | Mot de passe | Rôle | user_type |
|-------|--------------|------|-----------|
| admin@test.com | admin123 | Administrateur | `admin` |
| host1@test.com | host123 | Propriétaire | `owner` |
| guest1@test.com | guest123 | Voyageur | `traveler` |
| service1@test.com | service123 | Prestataire | `provider` |

## Vérification

Après l'exécution, vérifiez que les rôles sont correctement assignés :

```sql
SELECT 
  au.email,
  up.user_type,
  up.first_name,
  up.last_name
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE au.email IN ('admin@test.com', 'host1@test.com', 'guest1@test.com', 'service1@test.com')
ORDER BY au.email;
```

