# 🔧 Guide d'Échappement SQL - Éviter les Erreurs de Syntaxe

## ❌ **Erreur : Syntax Error avec Apostrophes**

### **Problème Identifié**
L'erreur `syntax error at or near "électricité"` est causée par l'apostrophe non échappée dans le texte SQL.

## 🔍 **Règle d'Échappement SQL**

### **En SQL, les apostrophes doivent être doublées**
```sql
-- ❌ Incorrect
'Bonjour, j'ai une question'

-- ✅ Correct
'Bonjour, j''ai une question'
```

## 🛠️ **Corrections Appliquées**

### **1. Échappement des Apostrophes dans les Notifications**
```sql
-- Avant (incorrect)
'Nouvelle demande de service d\'électricité'

-- Après (correct)
'Nouvelle demande de service d''électricité'
```

### **2. Échappement des Apostrophes dans les Messages**
```sql
-- Avant (incorrect)
'Bonjour, j\'ai une question'

-- Après (correct)
'Bonjour, j''ai une question'
```

## 📋 **Règles d'Échappement SQL**

### **Caractères à Échapper**
| **Caractère** | **Échappement** | **Exemple** |
|---------------|-----------------|-------------|
| `'` (apostrophe) | `''` (double apostrophe) | `j'ai` → `j''ai` |
| `"` (guillemet) | `""` (double guillemet) | `"texte"` → `""texte""` |
| `\` (backslash) | `\\` (double backslash) | `\n` → `\\n` |

### **Exemples Pratiques**
```sql
-- Texte avec apostrophe
INSERT INTO messages (content) VALUES ('Bonjour, j''ai une question');

-- Texte avec guillemets
INSERT INTO messages (content) VALUES ('Il a dit ""Bonjour""');

-- Texte avec backslash
INSERT INTO messages (content) VALUES ('Chemin: C:\\Users\\Documents');
```

## 🔧 **Méthodes d'Échappement**

### **Méthode 1 : Échappement Manuel**
```sql
-- Remplacer chaque apostrophe par deux apostrophes
'Bonjour, j''ai une question'
```

### **Méthode 2 : Utilisation de $$ (Dollar Quoting)**
```sql
-- Utiliser $$ pour éviter l'échappement
INSERT INTO messages (content) VALUES ($$Bonjour, j'ai une question$$);
```

### **Méthode 3 : Utilisation de Variables**
```sql
-- Utiliser des variables pour éviter l'échappement
DO $$
DECLARE
    message_text TEXT := 'Bonjour, j''ai une question';
BEGIN
    INSERT INTO messages (content) VALUES (message_text);
END $$;
```

## 🚨 **Erreurs Courantes et Solutions**

### **Erreur 1 : Apostrophe Non Échappée**
```sql
-- ❌ Erreur
INSERT INTO messages (content) VALUES ('Bonjour, j'ai une question');

-- ✅ Solution
INSERT INTO messages (content) VALUES ('Bonjour, j''ai une question');
```

### **Erreur 2 : Guillemets Non Échappés**
```sql
-- ❌ Erreur
INSERT INTO messages (content) VALUES ('Il a dit "Bonjour"');

-- ✅ Solution
INSERT INTO messages (content) VALUES ('Il a dit ""Bonjour""');
```

### **Erreur 3 : Backslash Non Échappé**
```sql
-- ❌ Erreur
INSERT INTO messages (content) VALUES ('Chemin: C:\Users\Documents');

-- ✅ Solution
INSERT INTO messages (content) VALUES ('Chemin: C:\\Users\\Documents');
```

## 🎯 **Bonnes Pratiques**

### **1. Utiliser des Fonctions d'Échappement**
```typescript
// Fonction d'échappement en TypeScript
function escapeSqlString(str: string): string {
    return str.replace(/'/g, "''");
}

// Utilisation
const message = "Bonjour, j'ai une question";
const escapedMessage = escapeSqlString(message);
```

### **2. Utiliser des Requêtes Paramétrées**
```typescript
// Utilisation de requêtes paramétrées avec Supabase
const { data, error } = await supabase
    .from('messages')
    .insert({
        content: "Bonjour, j'ai une question" // Pas besoin d'échappement
    });
```

### **3. Utiliser des Templates Literals**
```typescript
// Utilisation de templates literals
const message = `Bonjour, j'ai une question`;
const query = `INSERT INTO messages (content) VALUES ('${message.replace(/'/g, "''")}')`;
```

## ✅ **Vérification des Corrections**

### **Tester l'Insertion**
```sql
-- Tester l'insertion avec apostrophe
INSERT INTO messages (content) VALUES ('Test avec apostrophe: j''ai testé');

-- Vérifier que l'insertion a fonctionné
SELECT * FROM messages WHERE content LIKE '%apostrophe%';
```

### **Vérifier les Données**
```sql
-- Vérifier que les apostrophes sont correctement stockées
SELECT content FROM messages WHERE content LIKE '%j''ai%';
```

## 📚 **Outils d'Échappement**

### **1. Fonction SQL d'Échappement**
```sql
-- Créer une fonction d'échappement
CREATE OR REPLACE FUNCTION escape_sql_string(input_string TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN replace(input_string, '''', '''''');
END;
$$ LANGUAGE plpgsql;

-- Utilisation
INSERT INTO messages (content) VALUES (escape_sql_string('Bonjour, j''ai une question'));
```

### **2. Script de Vérification**
```sql
-- Vérifier les apostrophes dans les données
SELECT 
    content,
    CASE 
        WHEN content LIKE '%''%' THEN 'Apostrophe échappée'
        WHEN content LIKE '%''%' THEN 'Apostrophe non échappée'
        ELSE 'Pas d''apostrophe'
    END as status
FROM messages;
```

## 🎯 **Prochaines Étapes**

1. **Utilisez le script corrigé** `insert-test-data.sql`
2. **Vérifiez** que les apostrophes sont correctement échappées
3. **Testez** l'insertion des données
4. **Appliquez** les bonnes pratiques pour les futurs scripts

**🔧 Ce guide vous aidera à éviter les erreurs de syntaxe SQL liées aux apostrophes et autres caractères spéciaux !**


