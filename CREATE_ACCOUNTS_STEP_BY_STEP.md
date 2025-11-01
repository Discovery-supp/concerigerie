# 🚀 Guide Étape par Étape - Création des Comptes de Test

## 📋 **Mots de Passe des Comptes de Test**

| Email | Mot de Passe | Rôle | Nom |
|-------|-------------|------|-----|
| `admin@test.com` | `admin123` | Administrateur | Admin Test |
| `host1@test.com` | `host123` | Propriétaire | Marie Dubois |
| `host2@test.com` | `host123` | Propriétaire | Pierre Martin |
| `guest1@test.com` | `guest123` | Voyageur | Jean Dupont |
| `guest2@test.com` | `guest123` | Voyageur | Claire Moreau |
| `service1@test.com` | `service123` | Prestataire | Marc Leroy |
| `service2@test.com` | `service123` | Prestataire | Julie Roux |

## 🔧 **Étape 1 : Créer les Utilisateurs dans Supabase**

### **Via l'Interface Supabase (Recommandé)**

1. **Allez dans votre dashboard Supabase**
2. **Cliquez sur "Authentication" dans le menu de gauche**
3. **Cliquez sur "Users"**
4. **Cliquez sur "Add user"**
5. **Créez chaque utilisateur avec ces informations :**

#### **Utilisateur 1 - Administrateur**
- **Email:** `admin@test.com`
- **Mot de passe:** `admin123`
- **Confirmer l'email:** ✅ (cochez la case)

#### **Utilisateur 2 - Propriétaire 1**
- **Email:** `host1@test.com`
- **Mot de passe:** `host123`
- **Confirmer l'email:** ✅

#### **Utilisateur 3 - Propriétaire 2**
- **Email:** `host2@test.com`
- **Mot de passe:** `host123`
- **Confirmer l'email:** ✅

#### **Utilisateur 4 - Voyageur 1**
- **Email:** `guest1@test.com`
- **Mot de passe:** `guest123`
- **Confirmer l'email:** ✅

#### **Utilisateur 5 - Voyageur 2**
- **Email:** `guest2@test.com`
- **Mot de passe:** `guest123`
- **Confirmer l'email:** ✅

#### **Utilisateur 6 - Prestataire 1**
- **Email:** `service1@test.com`
- **Mot de passe:** `service123`
- **Confirmer l'email:** ✅

#### **Utilisateur 7 - Prestataire 2**
- **Email:** `service2@test.com`
- **Mot de passe:** `service123`
- **Confirmer l'email:** ✅

## 🗄️ **Étape 2 : Créer les Profils Utilisateurs**

### **Via l'Éditeur SQL de Supabase**

1. **Allez dans "SQL Editor" dans votre dashboard Supabase**
2. **Copiez et exécutez ce script :**

```sql
-- Créer les profils utilisateurs
INSERT INTO user_profiles (id, email, first_name, last_name, phone, user_type, created_at, updated_at) VALUES
('admin-001', 'admin@test.com', 'Admin', 'Test', '+33123456789', 'admin', NOW(), NOW()),
('owner-001', 'host1@test.com', 'Marie', 'Dubois', '+33123456790', 'owner', NOW(), NOW()),
('owner-002', 'host2@test.com', 'Pierre', 'Martin', '+33123456791', 'owner', NOW(), NOW()),
('traveler-001', 'guest1@test.com', 'Jean', 'Dupont', '+33123456792', 'traveler', NOW(), NOW()),
('traveler-002', 'guest2@test.com', 'Claire', 'Moreau', '+33123456793', 'traveler', NOW(), NOW()),
('provider-001', 'service1@test.com', 'Marc', 'Leroy', '+33123456794', 'provider', NOW(), NOW()),
('provider-002', 'service2@test.com', 'Julie', 'Roux', '+33123456795', 'provider', NOW(), NOW());
```

## 🏠 **Étape 3 : Créer les Données de Test**

### **Propriétés, Réservations, Avis, Messages**

Exécutez ce script dans l'éditeur SQL :

```sql
-- Créer les propriétés de test
INSERT INTO properties (
    id, owner_id, title, description, type, address, surface, max_guests, 
    bedrooms, bathrooms, beds, price_per_night, cleaning_fee, min_nights, 
    max_nights, amenities, images, rules, cancellation_policy, check_in_time, 
    check_out_time, category, neighborhood, beach_access, is_published, 
    created_at, updated_at
) VALUES
('prop-001', 'owner-001', 'Villa Paradis', 'Magnifique villa avec piscine', 'villa', 'Nice, France', 120, 8, 4, 3, 4, 250, 50, 2, 14, 
 ARRAY['WiFi', 'Piscine', 'Parking'], 
 ARRAY['https://images.unsplash.com/photo-1566073771259-6a8506099945'], 
 ARRAY['Pas de fumeur'], 
 'moderate', '15:00', '11:00', 'luxe', 'Nice', true, true, NOW(), NOW()),
('prop-002', 'owner-002', 'Appartement Moderne', 'Appartement moderne en centre-ville', 'appartement', 'Paris, France', 65, 4, 2, 1, 2, 120, 30, 1, 30, 
 ARRAY['WiFi', 'Climatisation'], 
 ARRAY['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'], 
 ARRAY['Pas de fumeur'], 
 'flexible', '14:00', '10:00', 'standard', 'Paris', false, true, NOW(), NOW());

-- Créer les réservations de test
INSERT INTO reservations (
    id, property_id, guest_id, check_in, check_out, adults, children, infants, pets, 
    total_amount, status, payment_method, payment_status, special_requests, 
    additional_services, created_at, updated_at
) VALUES
('res-001', 'prop-001', 'traveler-001', '2024-02-15', '2024-02-20', 2, 1, 0, 0, 1250, 'confirmed', 'card', 'paid', 'Anniversaire', ARRAY['petit-déjeuner'], NOW(), NOW()),
('res-002', 'prop-002', 'traveler-002', '2024-02-10', '2024-02-12', 2, 0, 0, 0, 240, 'pending', 'card', 'pending', 'Voyage d''affaires', ARRAY[], NOW(), NOW());

-- Créer les avis de test
INSERT INTO reviews (
    id, reservation_id, property_id, guest_id, rating, comment, created_at
) VALUES
('rev-001', 'res-001', 'prop-001', 'traveler-001', 5, 'Villa exceptionnelle ! Je recommande vivement.', NOW());

-- Créer les messages de test
INSERT INTO messages (
    id, sender_id, receiver_id, subject, content, is_read, created_at, updated_at
) VALUES
('msg-001', 'traveler-001', 'admin-001', 'Question', 'Bonjour, j''ai une question sur ma réservation.', false, NOW(), NOW()),
('msg-002', 'owner-001', 'admin-001', 'Support', 'Bonjour, j''ai besoin d''aide avec ma propriété.', false, NOW(), NOW());
```

## 🧪 **Étape 4 : Tester l'Application**

### **Démarrer l'Application**

```bash
npm run dev
```

### **Tester la Connexion**

1. **Allez sur la page de connexion**
2. **Utilisez les identifiants ci-dessus**
3. **Testez chaque tableau de bord spécialisé**

## ✅ **Vérification**

### **Vérifier que les Comptes Existent**

Exécutez ce script pour vérifier :

```sql
-- Vérifier les utilisateurs créés
SELECT 
    user_type,
    COUNT(*) as count,
    STRING_AGG(email, ', ') as emails
FROM user_profiles 
WHERE id LIKE '%-001' OR id LIKE '%-002'
GROUP BY user_type
ORDER BY user_type;
```

### **Vérifier les Données de Test**

```sql
-- Vérifier les propriétés
SELECT title, owner_id, is_published FROM properties WHERE id LIKE 'prop-%';

-- Vérifier les réservations
SELECT id, status, total_amount FROM reservations WHERE id LIKE 'res-%';

-- Vérifier les avis
SELECT rating, comment FROM reviews WHERE id LIKE 'rev-%';

-- Vérifier les messages
SELECT subject, is_read FROM messages WHERE id LIKE 'msg-%';
```

## 🎯 **Fonctionnalités à Tester**

### **1. Tableau de Bord Hôte**
- **Connexion:** `host1@test.com` / `host123`
- **Vérifiez:** Statistiques de la Villa Paradis
- **Testez:** Gestion des réservations et avis

### **2. Tableau de Bord Administrateur**
- **Connexion:** `admin@test.com` / `admin123`
- **Vérifiez:** Vue d'ensemble globale
- **Testez:** Gestion des utilisateurs et analytics

### **3. Tableau de Bord Voyageur**
- **Connexion:** `guest1@test.com` / `guest123`
- **Vérifiez:** Réservations actuelles
- **Testez:** Historique et recherche

### **4. Tableau de Bord Prestataire**
- **Connexion:** `service1@test.com` / `service123`
- **Vérifiez:** Demandes de service
- **Testez:** Calendrier et statistiques

## 🔧 **Résolution de Problèmes**

### **Problème : Impossible de se connecter**
- ✅ Vérifiez que l'utilisateur existe dans `auth.users`
- ✅ Vérifiez que l'email est confirmé
- ✅ Vérifiez que le profil existe dans `user_profiles`

### **Problème : Données manquantes**
- ✅ Exécutez les scripts de création des données
- ✅ Vérifiez que les tables existent
- ✅ Vérifiez les contraintes de clé étrangère

### **Problème : Permissions**
- ✅ Vérifiez que RLS est configuré
- ✅ Vérifiez que les politiques existent
- ✅ Testez avec différents comptes

## 🎉 **Résultat Final**

Après avoir suivi ces étapes, vous devriez avoir :

- ✅ **7 comptes de test** avec mots de passe
- ✅ **2 propriétés** avec descriptions complètes
- ✅ **2 réservations** avec différents statuts
- ✅ **1 avis** avec note et commentaire
- ✅ **2 messages** entre utilisateurs
- ✅ **Tous les tableaux de bord** fonctionnels

**🚀 Vous êtes maintenant prêt à tester complètement votre application Nzoo Immo !**


