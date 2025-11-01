# 📊 Guide JSONB vs ARRAY - Base de Données Nzoo Immo

## ❌ **Erreur : Type JSONB vs ARRAY**

### **Problème Identifié**
L'erreur `column "amenities" is of type jsonb but expression is of type text[]` indique un conflit entre les types de données.

## 🔍 **Différence entre JSONB et ARRAY**

### **JSONB (JavaScript Object Notation Binary)**
- ✅ **Type natif PostgreSQL** pour stocker du JSON
- ✅ **Indexation** et recherche avancées
- ✅ **Validation** automatique du JSON
- ✅ **Performance** optimisée pour les requêtes JSON

### **ARRAY (Tableau PostgreSQL)**
- ✅ **Type natif PostgreSQL** pour les tableaux
- ✅ **Opérateurs** spécialisés (`@>`, `<@`, `&&`)
- ✅ **Performance** optimisée pour les opérations de tableau
- ✅ **Syntaxe** simple avec `ARRAY['item1', 'item2']`

## 🛠️ **Solutions pour Chaque Type**

### **Pour les Colonnes JSONB**

#### **Syntaxe Correcte :**
```sql
-- ✅ Correct pour JSONB
'["WiFi", "Piscine", "Parking"]'::jsonb

-- ❌ Incorrect pour JSONB
ARRAY['WiFi', 'Piscine', 'Parking']
```

#### **Exemples d'Insertion :**
```sql
-- Insertion avec JSONB
INSERT INTO properties (amenities, images, rules) VALUES
('["WiFi", "Piscine", "Parking"]'::jsonb, 
 '["image1.jpg", "image2.jpg"]'::jsonb, 
 '["Pas de fumeur", "Animaux acceptés"]'::jsonb);
```

### **Pour les Colonnes ARRAY**

#### **Syntaxe Correcte :**
```sql
-- ✅ Correct pour ARRAY
ARRAY['WiFi', 'Piscine', 'Parking']

-- ❌ Incorrect pour ARRAY
'["WiFi", "Piscine", "Parking"]'::jsonb
```

#### **Exemples d'Insertion :**
```sql
-- Insertion avec ARRAY
INSERT INTO properties (amenities, images, rules) VALUES
(ARRAY['WiFi', 'Piscine', 'Parking'], 
 ARRAY['image1.jpg', 'image2.jpg'], 
 ARRAY['Pas de fumeur', 'Animaux acceptés']);
```

## 🔧 **Script de Diagnostic**

### **Vérifier les Types de Colonnes**
```sql
-- Vérifier les types de colonnes dans properties
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name IN ('amenities', 'images', 'rules')
ORDER BY ordinal_position;
```

### **Tester les Types**
```sql
-- Tester l'insertion JSONB
SELECT '["WiFi", "Piscine"]'::jsonb as test_jsonb;

-- Tester l'insertion ARRAY
SELECT ARRAY['WiFi', 'Piscine'] as test_array;
```

## 📋 **Tableau de Correspondance**

| **Type de Colonne** | **Syntaxe d'Insertion** | **Exemple** |
|---------------------|-------------------------|-------------|
| `jsonb` | `'["item1", "item2"]'::jsonb` | `'["WiFi", "Piscine"]'::jsonb` |
| `text[]` | `ARRAY['item1', 'item2']` | `ARRAY['WiFi', 'Piscine']` |
| `varchar[]` | `ARRAY['item1', 'item2']` | `ARRAY['WiFi', 'Piscine']` |
| `integer[]` | `ARRAY[1, 2, 3]` | `ARRAY[1, 2, 3]` |

## 🎯 **Recommandations**

### **Quand Utiliser JSONB**
- ✅ **Données complexes** avec structure variable
- ✅ **Recherche** dans le contenu JSON
- ✅ **Validation** de structure JSON
- ✅ **APIs** qui retournent du JSON

### **Quand Utiliser ARRAY**
- ✅ **Listes simples** d'éléments du même type
- ✅ **Opérations** de tableau (union, intersection)
- ✅ **Performance** pour les listes courtes
- ✅ **Syntaxe** simple et lisible

## 🔄 **Conversion entre Types**

### **ARRAY vers JSONB**
```sql
-- Convertir ARRAY en JSONB
SELECT ARRAY['WiFi', 'Piscine']::text[]::jsonb as converted;
```

### **JSONB vers ARRAY**
```sql
-- Convertir JSONB en ARRAY
SELECT jsonb_array_elements_text('["WiFi", "Piscine"]'::jsonb) as converted;
```

## 🚨 **Erreurs Courantes et Solutions**

### **Erreur 1 : Type Mismatch**
```sql
-- ❌ Erreur
INSERT INTO properties (amenities) VALUES (ARRAY['WiFi']);

-- ✅ Solution
INSERT INTO properties (amenities) VALUES ('["WiFi"]'::jsonb);
```

### **Erreur 2 : Syntaxe Incorrecte**
```sql
-- ❌ Erreur
INSERT INTO properties (amenities) VALUES ('WiFi, Piscine');

-- ✅ Solution
INSERT INTO properties (amenities) VALUES ('["WiFi", "Piscine"]'::jsonb);
```

### **Erreur 3 : Casting Manquant**
```sql
-- ❌ Erreur
INSERT INTO properties (amenities) VALUES ('["WiFi"]');

-- ✅ Solution
INSERT INTO properties (amenities) VALUES ('["WiFi"]'::jsonb);
```

## 📚 **Exemples Complets**

### **Insertion avec JSONB**
```sql
INSERT INTO properties (
    id, title, amenities, images, rules
) VALUES (
    'prop-001',
    'Villa Paradis',
    '["WiFi", "Piscine", "Parking"]'::jsonb,
    '["image1.jpg", "image2.jpg"]'::jsonb,
    '["Pas de fumeur", "Animaux acceptés"]'::jsonb
);
```

### **Insertion avec ARRAY**
```sql
INSERT INTO properties (
    id, title, amenities, images, rules
) VALUES (
    'prop-001',
    'Villa Paradis',
    ARRAY['WiFi', 'Piscine', 'Parking'],
    ARRAY['image1.jpg', 'image2.jpg'],
    ARRAY['Pas de fumeur', 'Animaux acceptés']
);
```

## ✅ **Vérification Finale**

### **Tester l'Insertion**
```sql
-- Tester l'insertion avec le bon type
INSERT INTO properties (id, amenities) 
VALUES ('test-001', '["WiFi"]'::jsonb);

-- Vérifier que l'insertion a fonctionné
SELECT amenities FROM properties WHERE id = 'test-001';

-- Nettoyer le test
DELETE FROM properties WHERE id = 'test-001';
```

## 🎯 **Prochaines Étapes**

1. **Exécutez le script de diagnostic** `check-column-types.sql`
2. **Identifiez les types** de vos colonnes
3. **Utilisez la syntaxe correcte** selon le type
4. **Testez l'insertion** avant d'exécuter le script complet

**🔧 Ce guide vous aidera à éviter les erreurs de type et à utiliser la bonne syntaxe pour chaque colonne !**


