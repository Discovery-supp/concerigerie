# Guide des Comptes de Test - Nzoo Immo

## 🎯 Comptes Créés

### 👨‍💼 **Administrateur**
- **Email:** `admin@test.com`
- **Nom:** Admin Test
- **Type:** Administrateur
- **Fonctionnalités:** Gestion complète de la plateforme

### 🏠 **Propriétaires (Hôtes)**

#### **Marie Dubois**
- **Email:** `host1@test.com`
- **Nom:** Marie Dubois
- **Type:** Propriétaire
- **Propriété:** Villa Paradis (Nice)
- **Fonctionnalités:** Gestion des réservations, statistiques, avis

#### **Pierre Martin**
- **Email:** `host2@test.com`
- **Nom:** Pierre Martin
- **Type:** Propriétaire
- **Propriété:** Appartement Moderne (Paris)
- **Fonctionnalités:** Gestion des réservations, statistiques, avis

### 🧳 **Voyageurs**

#### **Jean Dupont**
- **Email:** `guest1@test.com`
- **Nom:** Jean Dupont
- **Type:** Voyageur
- **Réservations:** Villa Paradis (confirmée)
- **Fonctionnalités:** Réservations, historique, recherche

#### **Claire Moreau**
- **Email:** `guest2@test.com`
- **Nom:** Claire Moreau
- **Type:** Voyageur
- **Réservations:** Appartement Moderne (en attente)
- **Fonctionnalités:** Réservations, historique, recherche

### 🛠️ **Prestataires de Service**

#### **Marc Leroy**
- **Email:** `service1@test.com`
- **Nom:** Marc Leroy
- **Type:** Prestataire
- **Services:** Nettoyage, maintenance
- **Fonctionnalités:** Demandes de service, calendrier

#### **Julie Roux**
- **Email:** `service2@test.com`
- **Nom:** Julie Roux
- **Type:** Prestataire
- **Services:** Électricité, plomberie
- **Fonctionnalités:** Demandes de service, calendrier

## 🏠 **Propriétés de Test**

### **Villa Paradis**
- **Propriétaire:** Marie Dubois
- **Type:** Villa
- **Localisation:** Nice, France
- **Prix:** 250€/nuit
- **Capacité:** 8 personnes
- **Équipements:** Piscine, WiFi, Parking
- **Statut:** Publiée

### **Appartement Moderne**
- **Propriétaire:** Pierre Martin
- **Type:** Appartement
- **Localisation:** Paris, France
- **Prix:** 120€/nuit
- **Capacité:** 4 personnes
- **Équipements:** WiFi, Climatisation
- **Statut:** Publiée

## 📅 **Réservations de Test**

### **Réservation Confirmée**
- **Propriété:** Villa Paradis
- **Voyageur:** Jean Dupont
- **Dates:** 15-20 février 2024
- **Montant:** 1250€
- **Statut:** Confirmée et payée

### **Réservation en Attente**
- **Propriété:** Appartement Moderne
- **Voyageur:** Claire Moreau
- **Dates:** 10-12 février 2024
- **Montant:** 240€
- **Statut:** En attente de paiement

## ⭐ **Avis de Test**

### **Avis 5 étoiles**
- **Propriété:** Villa Paradis
- **Voyageur:** Jean Dupont
- **Note:** 5/5
- **Commentaire:** "Villa exceptionnelle ! Je recommande vivement."

## 💬 **Messages de Test**

### **Messages Voyageur → Admin**
- **De:** Jean Dupont
- **À:** Admin
- **Sujet:** Question sur réservation
- **Statut:** Non lu

### **Messages Propriétaire → Admin**
- **De:** Marie Dubois
- **À:** Admin
- **Sujet:** Support
- **Statut:** Non lu

## 🧪 **Comment Tester les Fonctionnalités**

### **1. Test du Tableau de Bord Hôte**
1. Connectez-vous avec `host1@test.com`
2. Allez sur `/dashboard`
3. Vérifiez les statistiques (1 propriété, 1 réservation)
4. Testez la gestion des réservations
5. Consultez les avis reçus

### **2. Test du Tableau de Bord Voyageur**
1. Connectez-vous avec `guest1@test.com`
2. Allez sur `/dashboard`
3. Vérifiez les réservations actuelles
4. Consultez l'historique
5. Testez la recherche de propriétés

### **3. Test du Tableau de Bord Administrateur**
1. Connectez-vous avec `admin@test.com`
2. Allez sur `/dashboard`
3. Consultez la vue d'ensemble
4. Testez la gestion des utilisateurs
5. Vérifiez les réservations globales

### **4. Test du Tableau de Bord Prestataire**
1. Connectez-vous avec `service1@test.com`
2. Allez sur `/dashboard`
3. Consultez les demandes de service
4. Testez le calendrier des interventions
5. Vérifiez les statistiques de performance

### **5. Test du Système de Notifications**
1. Connectez-vous avec n'importe quel compte
2. Cliquez sur l'icône de notification (🔔)
3. Vérifiez les notifications non lues
4. Testez les filtres par type
5. Marquez des notifications comme lues

### **6. Test des Analytics**
1. Connectez-vous avec `admin@test.com`
2. Allez sur `/analytics`
3. Consultez les métriques de performance
4. Testez les filtres de période
5. Vérifiez les rapports financiers

## 🔧 **Fonctionnalités à Tester**

### **Gestion des Propriétés**
- ✅ Créer une nouvelle propriété
- ✅ Modifier une propriété existante
- ✅ Publier/Dépublier une propriété
- ✅ Gérer les images et descriptions

### **Gestion des Réservations**
- ✅ Voir les réservations en cours
- ✅ Confirmer/Annuler des réservations
- ✅ Gérer les statuts de paiement
- ✅ Consulter les détails des invités

### **Système de Messagerie**
- ✅ Envoyer des messages
- ✅ Recevoir des notifications
- ✅ Gérer les conversations
- ✅ Filtrer par type de message

### **Gestion des Avis**
- ✅ Laisser des avis
- ✅ Consulter les avis reçus
- ✅ Gérer les statistiques
- ✅ Filtrer par note

### **Analytics et Rapports**
- ✅ Consulter les métriques
- ✅ Analyser les tendances
- ✅ Exporter les rapports
- ✅ Comparer les périodes

## 🚨 **Points d'Attention**

### **Authentification**
- Les comptes de test n'ont pas de mots de passe définis
- Vous devrez créer des comptes réels via l'interface d'inscription
- Ou utiliser l'authentification Supabase directement

### **Base de Données**
- Assurez-vous que toutes les tables existent
- Vérifiez que les contraintes de clé étrangère sont respectées
- Exécutez les scripts de migration si nécessaire

### **Permissions**
- Vérifiez que RLS (Row Level Security) est configuré
- Testez les permissions par rôle
- Assurez-vous que les utilisateurs ne voient que leurs données

## 📝 **Scripts de Test**

### **Créer les Comptes**
```sql
-- Exécutez test-accounts-simple.sql dans Supabase
```

### **Vérifier les Données**
```sql
-- Vérifier les utilisateurs
SELECT user_type, COUNT(*) FROM user_profiles GROUP BY user_type;

-- Vérifier les propriétés
SELECT title, owner_id, is_published FROM properties;

-- Vérifier les réservations
SELECT id, status, total_amount FROM reservations;
```

### **Nettoyer les Données de Test**
```sql
-- Supprimer les données de test
DELETE FROM reviews WHERE id LIKE 'rev-%';
DELETE FROM reservations WHERE id LIKE 'res-%';
DELETE FROM messages WHERE id LIKE 'msg-%';
DELETE FROM properties WHERE id LIKE 'prop-%';
DELETE FROM user_profiles WHERE id LIKE '%-001' OR id LIKE '%-002';
```

## 🎯 **Résultats Attendus**

Après avoir créé les comptes de test, vous devriez pouvoir :

1. **Se connecter** avec chaque type de compte
2. **Voir des données** dans chaque tableau de bord
3. **Tester toutes les fonctionnalités** sans erreur
4. **Naviguer** entre les différentes sections
5. **Vérifier** que les permissions fonctionnent correctement

## 🔄 **Prochaines Étapes**

1. **Exécutez** le script `test-accounts-simple.sql`
2. **Vérifiez** que les données ont été créées
3. **Testez** chaque tableau de bord
4. **Créez** des comptes réels si nécessaire
5. **Explorez** toutes les fonctionnalités

Les comptes de test vous permettront de tester complètement toutes les fonctionnalités des tableaux de bord spécialisés !


