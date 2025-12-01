# 🔐 Création Manuelle des Comptes de Test - Nzoo Immo

## ⚠️ **Problème Résolu : UUIDs Invalides**

L'erreur `invalid input syntax for type uuid: "admin-001"` indique que Supabase attend des UUIDs valides. Voici la solution la plus simple :

## 🚀 **Méthode Recommandée : Interface Supabase**

### **Étape 1 : Créer les Utilisateurs via l'Interface**

1. **Allez dans votre dashboard Supabase**
2. **Cliquez sur "Authentication" dans le menu de gauche**
3. **Cliquez sur "Users"**
4. **Cliquez sur "Add user"**
5. **Créez chaque utilisateur avec ces informations :**

#### **👨‍💼 Administrateur**
- **Email:** `admin@test.com`
- **Mot de passe:** `admin123`
- **Confirmer l'email:** ✅ (cochez la case)

#### **🏠 Propriétaire 1**
- **Email:** `host1@test.com`
- **Mot de passe:** `host123`
- **Confirmer l'email:** ✅

#### **🏠 Propriétaire 2**
- **Email:** `host2@test.com`
- **Mot de passe:** `host123`
- **Confirmer l'email:** ✅

#### **🧳 Voyageur 1**
- **Email:** `guest1@test.com`
- **Mot de passe:** `guest123`
- **Confirmer l'email:** ✅

#### **🧳 Voyageur 2**
- **Email:** `guest2@test.com`
- **Mot de passe:** `guest123`
- **Confirmer l'email:** ✅

#### **🛠️ Prestataire 1**
- **Email:** `service1@test.com`
- **Mot de passe:** `service123`
- **Confirmer l'email:** ✅

#### **🛠️ Prestataire 2**
- **Email:** `service2@test.com`
- **Mot de passe:** `service123`
- **Confirmer l'email:** ✅

### **Étape 2 : Récupérer les UUIDs**

Après avoir créé les utilisateurs, récupérez leurs UUIDs :

1. **Dans la liste des utilisateurs, notez l'UUID de chaque utilisateur**
2. **Ou exécutez cette requête SQL :**

```sql
-- Récupérer les UUIDs des utilisateurs créés
SELECT id, email FROM auth.users 
WHERE email IN (
    'admin@test.com',
    'host1@test.com', 
    'host2@test.com',
    'guest1@test.com',
    'guest2@test.com',
    'service1@test.com',
    'service2@test.com'
);
```

### **Étape 3 : Créer les Profils Utilisateurs**

Remplacez les UUIDs dans ce script par ceux que vous avez récupérés :

```sql
-- Créer les profils utilisateurs (remplacez les UUIDs par les vrais)
INSERT INTO user_profiles (id, email, first_name, last_name, phone, user_type, created_at, updated_at) VALUES
-- Remplacez 'VOTRE_UUID_ADMIN' par l'UUID réel de admin@test.com
('VOTRE_UUID_ADMIN', 'admin@test.com', 'Admin', 'Test', '+33123456789', 'admin', NOW(), NOW()),

-- Remplacez 'VOTRE_UUID_HOST1' par l'UUID réel de host1@test.com
('VOTRE_UUID_HOST1', 'host1@test.com', 'Marie', 'Dubois', '+33123456790', 'owner', NOW(), NOW()),

-- Remplacez 'VOTRE_UUID_HOST2' par l'UUID réel de host2@test.com
('VOTRE_UUID_HOST2', 'host2@test.com', 'Pierre', 'Martin', '+33123456791', 'owner', NOW(), NOW()),

-- Remplacez 'VOTRE_UUID_GUEST1' par l'UUID réel de guest1@test.com
('VOTRE_UUID_GUEST1', 'guest1@test.com', 'Jean', 'Dupont', '+33123456792', 'traveler', NOW(), NOW()),

-- Remplacez 'VOTRE_UUID_GUEST2' par l'UUID réel de guest2@test.com
('VOTRE_UUID_GUEST2', 'guest2@test.com', 'Claire', 'Moreau', '+33123456793', 'traveler', NOW(), NOW()),

-- Remplacez 'VOTRE_UUID_SERVICE1' par l'UUID réel de service1@test.com
('VOTRE_UUID_SERVICE1', 'service1@test.com', 'Marc', 'Leroy', '+33123456794', 'provider', NOW(), NOW()),

-- Remplacez 'VOTRE_UUID_SERVICE2' par l'UUID réel de service2@test.com
('VOTRE_UUID_SERVICE2', 'service2@test.com', 'Julie', 'Roux', '+33123456795', 'provider', NOW(), NOW());
```

### **Étape 4 : Créer les Données de Test**

```sql
-- Créer les propriétés de test
INSERT INTO properties (
    id, owner_id, title, description, type, address, surface, max_guests, 
    bedrooms, bathrooms, beds, price_per_night, cleaning_fee, min_nights, 
    max_nights, amenities, images, rules, cancellation_policy, check_in_time, 
    check_out_time, category, neighborhood, beach_access, is_published, 
    created_at, updated_at
) VALUES
-- Remplacez 'VOTRE_UUID_HOST1' par l'UUID réel de host1@test.com
('550e8400-e29b-41d4-a716-446655440010', 'VOTRE_UUID_HOST1', 'Villa Paradis', 'Magnifique villa avec piscine', 'villa', 'Nice, France', 120, 8, 4, 3, 4, 250, 50, 2, 14, 
 ARRAY['WiFi', 'Piscine', 'Parking'], 
 ARRAY['https://images.unsplash.com/photo-1566073771259-6a8506099945'], 
 ARRAY['Pas de fumeur'], 
 'moderate', '15:00', '11:00', 'luxe', 'Nice', true, true, NOW(), NOW()),

-- Remplacez 'VOTRE_UUID_HOST2' par l'UUID réel de host2@test.com
('550e8400-e29b-41d4-a716-446655440011', 'VOTRE_UUID_HOST2', 'Appartement Moderne', 'Appartement moderne en centre-ville', 'appartement', 'Paris, France', 65, 4, 2, 1, 2, 120, 30, 1, 30, 
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
-- Remplacez les UUIDs par les vrais
('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440010', 'VOTRE_UUID_GUEST1', '2024-02-15', '2024-02-20', 2, 1, 0, 0, 1250, 'confirmed', 'card', 'paid', 'Anniversaire', ARRAY['petit-déjeuner'], NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440011', 'VOTRE_UUID_GUEST2', '2024-02-10', '2024-02-12', 2, 0, 0, 0, 240, 'pending', 'card', 'pending', 'Voyage d''affaires', ARRAY[], NOW(), NOW());

-- Créer les avis de test
INSERT INTO reviews (
    id, reservation_id, property_id, guest_id, rating, comment, created_at
) VALUES
('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440010', 'VOTRE_UUID_GUEST1', 5, 'Villa exceptionnelle ! Je recommande vivement.', NOW());

-- Créer les messages de test
INSERT INTO messages (
    id, sender_id, receiver_id, subject, content, is_read, created_at, updated_at
) VALUES
('550e8400-e29b-41d4-a716-446655440040', 'VOTRE_UUID_GUEST1', 'VOTRE_UUID_ADMIN', 'Question', 'Bonjour, j''ai une question sur ma réservation.', false, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440041', 'VOTRE_UUID_HOST1', 'VOTRE_UUID_ADMIN', 'Support', 'Bonjour, j''ai besoin d''aide avec ma propriété.', false, NOW(), NOW());
```

## 🎯 **Alternative : Script Automatique**

Si vous préférez utiliser un script automatique, utilisez le fichier `create-test-accounts-fixed.sql` qui contient des UUIDs valides prédéfinis.

## ✅ **Vérification**

Après avoir créé les comptes, vérifiez que tout fonctionne :

```sql
-- Vérifier les utilisateurs créés
SELECT 
    user_type,
    COUNT(*) as count,
    STRING_AGG(email, ', ') as emails
FROM user_profiles 
WHERE email IN (
    'admin@test.com',
    'host1@test.com', 
    'host2@test.com',
    'guest1@test.com',
    'guest2@test.com',
    'service1@test.com',
    'service2@test.com'
)
GROUP BY user_type
ORDER BY user_type;
```

## 🚀 **Tester l'Application**

1. **Démarrez l'application :** `npm run dev`
2. **Allez sur la page de connexion**
3. **Utilisez les identifiants ci-dessus**
4. **Testez chaque tableau de bord spécialisé**

## 📋 **Résumé des Identifiants**

| **Email** | **Mot de Passe** | **Rôle** |
|-----------|------------------|----------|
| `admin@test.com` | `admin123` | Administrateur |
| `host1@test.com` | `host123` | Propriétaire |
| `host2@test.com` | `host123` | Propriétaire |
| `guest1@test.com` | `guest123` | Voyageur |
| `guest2@test.com` | `guest123` | Voyageur |
| `service1@test.com` | `service123` | Prestataire |
| `service2@test.com` | `service123` | Prestataire |

**🎉 Cette méthode évite complètement l'erreur d'UUID et vous permet de créer les comptes facilement !**


