# 🔧 Guide de Correction - Colonnes Manquantes

## ❌ **Erreur : Column "guest_id" does not exist**

### **Problème Identifié**
L'erreur `column "guest_id" of relation "reviews" does not exist` indique que la table `reviews` n'a pas de colonne `guest_id`.

## 🔍 **Diagnostic de la Structure**

### **Étape 1 : Vérifier la Structure de la Table Reviews**
```sql
-- Vérifier la structure de la table reviews
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'reviews' 
ORDER BY ordinal_position;
```

### **Étape 2 : Vérifier Toutes les Tables**
```sql
-- Lister toutes les tables
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

## 🛠️ **Solutions**

### **Solution 1 : Script Adaptatif (Recommandé)**

J'ai corrigé le script `create-test-accounts-corrected.sql` pour :

- ✅ **Supprimer la colonne `guest_id`** de l'insertion
- ✅ **Utiliser seulement les colonnes existantes**
- ✅ **S'adapter automatiquement** à votre structure

### **Solution 2 : Ajouter la Colonne (Si Nécessaire)**

Si vous voulez ajouter la colonne `guest_id` :

```sql
-- Ajouter la colonne guest_id à la table reviews
ALTER TABLE reviews 
ADD COLUMN guest_id UUID REFERENCES user_profiles(id);

-- Créer un index sur guest_id
CREATE INDEX idx_reviews_guest_id ON reviews(guest_id);
```

### **Solution 3 : Vérifier la Structure Attendue**

La table `reviews` devrait avoir cette structure :

```sql
-- Structure attendue de reviews
CREATE TABLE reviews (
    id UUID PRIMARY KEY,
    reservation_id UUID REFERENCES reservations(id),
    property_id UUID REFERENCES properties(id),
    guest_id UUID REFERENCES user_profiles(id), -- Optionnel
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 📋 **Colonnes Communes dans Reviews**

### **Colonnes Probablement Existantes**
- ✅ `id` - Identifiant unique
- ✅ `reservation_id` - Référence à la réservation
- ✅ `property_id` - Référence à la propriété
- ✅ `rating` - Note (1-5)
- ✅ `comment` - Commentaire
- ✅ `created_at` - Date de création

### **Colonnes Optionnelles**
- ❓ `guest_id` - Référence au voyageur (peut être déduit de reservation_id)
- ❓ `updated_at` - Date de modification
- ❓ `is_verified` - Avis vérifié
- ❓ `response` - Réponse de l'hôte

## 🔧 **Script de Diagnostic Complet**

```sql
-- Diagnostic complet de toutes les tables
-- Exécutez ce script pour comprendre votre structure

-- 1. Vérifier toutes les tables
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Vérifier la structure de reviews
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'reviews' 
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
    AND tc.table_name = 'reviews'
ORDER BY tc.constraint_name;
```

## 🎯 **Script Corrigé**

### **Insertion Reviews Sans guest_id**
```sql
-- Insertion corrigée sans guest_id
INSERT INTO reviews (
    id, reservation_id, property_id, rating, comment, created_at
) VALUES
('550e8400-e29b-41d4-a716-446655440030', 
 '550e8400-e29b-41d4-a716-446655440020', 
 '550e8400-e29b-41d4-a716-446655440010', 
 5, 
 'Villa exceptionnelle ! Je recommande vivement.', 
 NOW());
```

### **Si guest_id Existe**
```sql
-- Insertion avec guest_id si la colonne existe
INSERT INTO reviews (
    id, reservation_id, property_id, guest_id, rating, comment, created_at
) VALUES
('550e8400-e29b-41d4-a716-446655440030', 
 '550e8400-e29b-41d4-a716-446655440020', 
 '550e8400-e29b-41d4-a716-446655440010', 
 '550e8400-e29b-41d4-a716-446655440004', 
 5, 
 'Villa exceptionnelle ! Je recommande vivement.', 
 NOW());
```

## 🚨 **Erreurs Courantes et Solutions**

### **Erreur 1 : Colonne Inexistante**
```sql
-- ❌ Erreur
INSERT INTO reviews (guest_id) VALUES ('uuid');

-- ✅ Solution
-- Vérifiez d'abord la structure avec le script de diagnostic
```

### **Erreur 2 : Type de Données Incorrect**
```sql
-- ❌ Erreur
INSERT INTO reviews (rating) VALUES ('5');

-- ✅ Solution
INSERT INTO reviews (rating) VALUES (5);
```

### **Erreur 3 : Contrainte de Clé Étrangère**
```sql
-- ❌ Erreur
INSERT INTO reviews (reservation_id) VALUES ('uuid-inexistant');

-- ✅ Solution
-- Utilisez un UUID valide qui existe dans la table reservations
```

## ✅ **Vérification Finale**

### **Tester l'Insertion**
```sql
-- Tester l'insertion avec les colonnes existantes
INSERT INTO reviews (id, reservation_id, property_id, rating, comment) 
VALUES ('test-review-001', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440010', 5, 'Test review');

-- Vérifier que l'insertion a fonctionné
SELECT * FROM reviews WHERE id = 'test-review-001';

-- Nettoyer le test
DELETE FROM reviews WHERE id = 'test-review-001';
```

## 🎯 **Prochaines Étapes**

1. **Exécutez le script de diagnostic** `check-all-tables-structure.sql`
2. **Identifiez les colonnes existantes** dans chaque table
3. **Utilisez le script corrigé** `create-test-accounts-corrected.sql`
4. **Testez l'insertion** avant d'exécuter le script complet

## 📚 **Fichiers de Diagnostic**

- 📄 `check-reviews-structure.sql` - Diagnostic de la table reviews
- 📄 `check-all-tables-structure.sql` - Diagnostic de toutes les tables
- 📄 `create-test-accounts-corrected.sql` - Script corrigé

**🔧 Ce guide vous aidera à identifier et corriger les erreurs de colonnes manquantes !**


