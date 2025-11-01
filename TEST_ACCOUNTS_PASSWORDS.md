# 🔐 Mots de Passe des Comptes de Test - Nzoo Immo

## 📋 **Comptes de Test avec Mots de Passe**

### 👨‍💼 **Administrateur**
- **Email:** `admin@test.com`
- **Mot de passe:** `admin123`
- **Rôle:** Administrateur
- **Accès:** Gestion complète de la plateforme

### 🏠 **Propriétaires (Hôtes)**

#### **Marie Dubois**
- **Email:** `host1@test.com`
- **Mot de passe:** `host123`
- **Rôle:** Propriétaire
- **Propriété:** Villa Paradis (Nice)

#### **Pierre Martin**
- **Email:** `host2@test.com`
- **Mot de passe:** `host123`
- **Rôle:** Propriétaire
- **Propriété:** Appartement Moderne (Paris)

### 🧳 **Voyageurs**

#### **Jean Dupont**
- **Email:** `guest1@test.com`
- **Mot de passe:** `guest123`
- **Rôle:** Voyageur
- **Réservations:** Villa Paradis (confirmée)

#### **Claire Moreau**
- **Email:** `guest2@test.com`
- **Mot de passe:** `guest123`
- **Rôle:** Voyageur
- **Réservations:** Appartement Moderne (en attente)

### 🛠️ **Prestataires de Service**

#### **Marc Leroy**
- **Email:** `service1@test.com`
- **Mot de passe:** `service123`
- **Rôle:** Prestataire
- **Services:** Nettoyage et maintenance

#### **Julie Roux**
- **Email:** `service2@test.com`
- **Mot de passe:** `service123`
- **Rôle:** Prestataire
- **Services:** Électricité et plomberie

## 🚀 **Comment Utiliser ces Comptes**

### **1. Créer les Comptes dans Supabase**

#### **Méthode A : Via l'Interface Supabase (Recommandée)**
1. Allez dans **Authentication > Users** dans votre dashboard Supabase
2. Cliquez sur **"Add user"**
3. Créez chaque utilisateur avec l'email et le mot de passe correspondant
4. Assurez-vous que l'email est confirmé

#### **Méthode B : Via l'API Supabase**
```javascript
// Exemple de création d'utilisateur via l'API
const { data, error } = await supabase.auth.signUp({
  email: 'admin@test.com',
  password: 'admin123',
  options: {
    data: {
      first_name: 'Admin',
      last_name: 'Test',
      user_type: 'admin'
    }
  }
});
```

### **2. Créer les Profils Utilisateurs**

Après avoir créé les utilisateurs dans l'authentification, exécutez ce script SQL :

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

### **3. Tester la Connexion**

1. **Démarrez l'application :** `npm run dev`
2. **Allez sur la page de connexion**
3. **Utilisez les emails et mots de passe ci-dessus**
4. **Testez chaque tableau de bord spécialisé**

## 🔧 **Script de Création Automatique**

Si vous préférez créer les comptes automatiquement, utilisez le script `create-test-accounts-with-passwords.sql` dans l'éditeur SQL de Supabase.

## ⚠️ **Points Importants**

### **Sécurité**
- ⚠️ **Ces mots de passe sont pour les tests uniquement**
- ⚠️ **Ne les utilisez pas en production**
- ⚠️ **Changez-les avant le déploiement**

### **Authentification**
- ✅ **Les comptes sont créés dans `auth.users`**
- ✅ **Les profils sont dans `user_profiles`**
- ✅ **RLS est configuré pour la sécurité**
- ✅ **Chaque utilisateur voit seulement ses données**

### **Données de Test**
- ✅ **2 propriétés** avec descriptions complètes
- ✅ **4 réservations** avec différents statuts
- ✅ **2 avis** avec notes et commentaires
- ✅ **3 messages** entre utilisateurs
- ✅ **3 notifications** de différents types

## 🎯 **Fonctionnalités à Tester**

### **Tableau de Bord Hôte**
1. Connectez-vous avec `host1@test.com` / `host123`
2. Vérifiez les statistiques de la Villa Paradis
3. Consultez les réservations et avis
4. Testez la messagerie avec l'admin

### **Tableau de Bord Administrateur**
1. Connectez-vous avec `admin@test.com` / `admin123`
2. Consultez la vue d'ensemble globale
3. Gérez les utilisateurs et réservations
4. Explorez les analytics avancées

### **Tableau de Bord Voyageur**
1. Connectez-vous avec `guest1@test.com` / `guest123`
2. Vérifiez vos réservations actuelles
3. Consultez l'historique et les avis
4. Testez la recherche de propriétés

### **Tableau de Bord Prestataire**
1. Connectez-vous avec `service1@test.com` / `service123`
2. Consultez les demandes de service
3. Gérez votre calendrier d'interventions
4. Vérifiez vos statistiques de performance

## 🔄 **Nettoyage des Données de Test**

Si vous voulez supprimer les comptes de test :

```sql
-- Supprimer les profils utilisateurs
DELETE FROM user_profiles WHERE id LIKE '%-001' OR id LIKE '%-002';

-- Supprimer les données associées
DELETE FROM reservations WHERE id LIKE 'res-%';
DELETE FROM properties WHERE id LIKE 'prop-%';
DELETE FROM reviews WHERE id LIKE 'rev-%';
DELETE FROM messages WHERE id LIKE 'msg-%';
```

## 📞 **Support**

Si vous rencontrez des problèmes :

1. **Vérifiez** que les utilisateurs sont créés dans `auth.users`
2. **Confirmez** que les profils existent dans `user_profiles`
3. **Testez** la connexion avec les identifiants ci-dessus
4. **Consultez** les logs de l'application pour les erreurs

**🎉 Vous êtes maintenant prêt à tester tous les tableaux de bord spécialisés !**


