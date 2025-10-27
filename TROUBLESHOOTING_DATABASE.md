# 🔧 Guide de Dépannage - Base de Données Nzoo Immo

## ❌ **Erreur : Column "email" does not exist**

### **Problème Identifié**
L'erreur `column "email" of relation "user_profiles" does not exist` indique que la table `user_profiles` n'a pas de colonne `email`.

### **🔍 Diagnostic**

#### **Étape 1 : Vérifier la Structure de la Table**
Exécutez ce script pour voir la vraie structure :

```sql
-- Vérifier la structure de la table user_profiles
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;
```

#### **Étape 2 : Vérifier si la Table Existe**
```sql
-- Vérifier si la table existe
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name = 'user_profiles';
```

#### **Étape 3 : Voir les Données Existantes**
```sql
-- Afficher quelques lignes pour comprendre la structure
SELECT * FROM user_profiles LIMIT 5;
```

### **🛠️ Solutions**

#### **Solution 1 : Script Adaptatif (Recommandé)**

Utilisez le fichier `create-test-accounts-corrected.sql` qui :

- ✅ **S'adapte automatiquement** à la structure de la table
- ✅ **Supprime la colonne email** si elle n'existe pas
- ✅ **Utilise les bonnes colonnes** disponibles
- ✅ **Gère les erreurs** gracieusement

#### **Solution 2 : Créer la Colonne Email (Si Nécessaire)**

Si vous voulez ajouter la colonne email :

```sql
-- Ajouter la colonne email à la table user_profiles
ALTER TABLE user_profiles 
ADD COLUMN email VARCHAR(255);

-- Créer un index sur l'email
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
```

#### **Solution 3 : Utiliser l'Interface Supabase**

**C'est la méthode la plus simple :**

1. **Allez dans votre dashboard Supabase**
2. **Cliquez sur "Authentication" > "Users"**
3. **Créez les utilisateurs manuellement** avec ces identifiants :

| **Email** | **Mot de Passe** | **Rôle** |
|-----------|------------------|----------|
| `admin@test.com` | `admin123` | Administrateur |
| `host1@test.com` | `host123` | Propriétaire |
| `host2@test.com` | `host123` | Propriétaire |
| `guest1@test.com` | `guest123` | Voyageur |
| `guest2@test.com` | `guest123` | Voyageur |
| `service1@test.com` | `service123` | Prestataire |
| `service2@test.com` | `service123` | Prestataire |

4. **Cochez "Confirm email" pour chaque utilisateur**

### **🔧 Script de Diagnostic Complet**

```sql
-- Script de diagnostic complet
-- Exécutez ce script pour comprendre la structure de votre base de données

-- 1. Vérifier toutes les tables
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Vérifier la structure de user_profiles
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- 3. Vérifier les contraintes de clé étrangère
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'user_profiles';

-- 4. Vérifier les index
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE tablename = 'user_profiles';
```

### **📋 Structure Attendue de user_profiles**

La table `user_profiles` devrait avoir cette structure :

```sql
-- Structure attendue de user_profiles
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    user_type VARCHAR(20) CHECK (user_type IN ('admin', 'owner', 'traveler', 'provider')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### **🚨 Problèmes Courants et Solutions**

#### **Problème 1 : Table user_profiles n'existe pas**
```sql
-- Créer la table user_profiles
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    user_type VARCHAR(20) CHECK (user_type IN ('admin', 'owner', 'traveler', 'provider')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **Problème 2 : Colonnes manquantes**
```sql
-- Ajouter les colonnes manquantes
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS user_type VARCHAR(20);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
```

#### **Problème 3 : Contraintes manquantes**
```sql
-- Ajouter les contraintes
ALTER TABLE user_profiles ADD CONSTRAINT check_user_type 
CHECK (user_type IN ('admin', 'owner', 'traveler', 'provider'));
```

### **✅ Vérification Finale**

Après avoir corrigé la structure, vérifiez que tout fonctionne :

```sql
-- Vérifier que la table a la bonne structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- Tester l'insertion d'un profil
INSERT INTO user_profiles (id, first_name, last_name, phone, user_type) 
VALUES ('550e8400-e29b-41d4-a716-446655440001', 'Test', 'User', '+33123456789', 'admin');

-- Vérifier que l'insertion a fonctionné
SELECT * FROM user_profiles WHERE id = '550e8400-e29b-41d4-a716-446655440001';
```

### **🎯 Prochaines Étapes**

1. **Exécutez le script de diagnostic** pour comprendre la structure
2. **Corrigez la structure** si nécessaire
3. **Utilisez le script corrigé** `create-test-accounts-corrected.sql`
4. **Testez l'application** avec les comptes créés

### **📞 Support**

Si vous rencontrez encore des problèmes :

1. **Exécutez le script de diagnostic complet**
2. **Partagez les résultats** pour analyse
3. **Vérifiez que toutes les tables existent**
4. **Testez les contraintes de clé étrangère**

**🔧 Ce guide vous aidera à résoudre tous les problèmes de structure de base de données !**


