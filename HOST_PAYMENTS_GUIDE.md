# Système de Gestion des Paiements aux Hôtes - Guide d'Utilisation

## 🎯 Vue d'ensemble

Le système de gestion des paiements aux hôtes permet de :
- Calculer automatiquement les commissions de l'application
- Gérer les paiements mensuels aux hôtes
- Suivre les bénéfices de l'application
- Fournir des statistiques détaillées par hôte et par période

## 📊 Fonctionnalités Principales

### Pour les Hôtes
- **Vue des gains** : Consulter leurs revenus mensuels
- **Détails des paiements** : Voir le détail de chaque réservation
- **Statistiques personnelles** : Suivre leur performance
- **Historique des paiements** : Accéder à l'historique complet

### Pour les Administrateurs
- **Gestion des commissions** : Modifier le taux de commission
- **Calcul automatique** : Générer les paiements mensuels
- **Suivi des paiements** : Marquer les paiements comme effectués
- **Statistiques globales** : Voir les revenus de l'application
- **Analyse par hôte** : Consulter les performances individuelles

## 🚀 Installation et Configuration

### 1. Appliquer la Migration
Exécutez le script SQL `apply_host_payment_system.sql` dans l'interface Supabase :

```sql
-- Le script crée les tables suivantes :
-- - commission_settings : Configuration des taux de commission
-- - host_payments : Paiements mensuels aux hôtes
-- - host_payment_details : Détails par réservation
-- - app_earnings : Statistiques globales de l'application
```

### 2. Configuration Initiale
- Le taux de commission par défaut est de **10%**
- Les paiements sont calculés mensuellement
- Seules les réservations **payées** et **confirmées/complétées** sont prises en compte

## 💰 Calcul des Commissions

### Formule de Calcul
```
Commission Application = Montant Réservation × Taux Commission (%)
Gains Hôte = Montant Réservation - Commission Application
```

### Exemple
- Réservation : 1000 USD
- Taux de commission : 10%
- Commission application : 100 USD
- Gains hôte : 900 USD

## 📱 Utilisation du Système

### Pour les Hôtes

#### Accéder aux Gains
1. Connectez-vous à votre compte hôte
2. Allez dans le **Tableau de bord Hôte**
3. Cliquez sur l'onglet **"Mes Gains"**

#### Informations Disponibles
- **Gains totaux** : Montant total gagné
- **Réservations** : Nombre total de réservations
- **Commission app** : Montant des commissions prélevées
- **Moyenne/réservation** : Gain moyen par réservation
- **Gains mensuels** : Évolution mois par mois
- **Historique des paiements** : Liste détaillée

#### Détails d'un Paiement
- Cliquez sur l'icône **👁️** pour voir les détails
- Consultez chaque réservation incluse dans le paiement
- Vérifiez les montants et commissions

### Pour les Administrateurs

#### Accéder à la Gestion des Paiements
1. Connectez-vous avec un compte administrateur
2. Allez dans le **Tableau de bord Admin**
3. Cliquez sur l'onglet **"Paiements"**

#### Fonctionnalités Administrateur

##### 1. Configuration des Commissions
- Cliquez sur **"Commission (10%)"**
- Modifiez le taux de commission
- ⚠️ **Important** : Les modifications s'appliquent aux nouvelles réservations uniquement

##### 2. Calcul des Paiements
- Cliquez sur **"Calculer Ce Mois"**
- Le système calcule automatiquement les paiements pour le mois en cours
- Génère les statistiques globales

##### 3. Gestion des Paiements
- Consultez la liste des paiements aux hôtes
- Marquez les paiements comme **effectués** (icône ✅)
- Suivez le statut de chaque paiement

##### 4. Statistiques Globales
- **Revenus totaux** : Chiffre d'affaires total
- **Bénéfices net** : Gains de l'application
- **Commission totale** : Montant des commissions
- **Paiements hôtes** : Montant versé aux hôtes
- **Revenus mensuels** : Évolution mois par mois

## 🔧 Fonctions Techniques

### Fonction `calculate_host_payments(month, year)`
Calcule automatiquement les paiements pour un mois donné :
- Récupère le taux de commission actuel
- Parcourt tous les hôtes avec des réservations payées
- Calcule les commissions et gains
- Met à jour les statistiques globales

### Fonction `mark_host_payment_paid(payment_id, method, reference)`
Marque un paiement comme effectué :
- Met à jour le statut à "paid"
- Enregistre la méthode de paiement
- Ajoute la référence de paiement
- Timestamp du paiement

## 📈 Statistiques et Rapports

### Statistiques Hôte
- Gains totaux et moyens
- Nombre de réservations
- Évolution mensuelle
- Performance par période

### Statistiques Application
- Revenus totaux
- Commission totale
- Nombre de réservations
- Croissance mensuelle
- Analyse par hôte

## ⚠️ Points Importants

### Sécurité
- Seuls les administrateurs peuvent modifier les taux de commission
- Les hôtes ne voient que leurs propres paiements
- RLS (Row Level Security) activé sur toutes les tables

### Calculs
- Seules les réservations **payées** sont incluses
- Statuts pris en compte : **confirmed**, **completed**
- Les réservations **cancelled** ou **refunded** sont exclues

### Paiements
- Les paiements sont calculés par mois calendaire
- Un hôte ne peut avoir qu'un paiement par mois
- Les calculs peuvent être relancés pour mettre à jour les montants

## 🚨 Résolution de Problèmes

### Problème : "Aucun paiement trouvé"
- Vérifiez que des réservations sont payées et confirmées
- Lancez le calcul des paiements pour le mois concerné
- Vérifiez les statuts des réservations

### Problème : "Commission incorrecte"
- Vérifiez le taux de commission dans les paramètres
- Relancez le calcul des paiements
- Vérifiez que les réservations sont dans le bon statut

### Problème : "Accès refusé"
- Vérifiez que l'utilisateur a le bon rôle (admin/host)
- Vérifiez les politiques RLS
- Vérifiez l'authentification

## 📞 Support

Pour toute question ou problème :
1. Vérifiez ce guide d'utilisation
2. Consultez les logs de la console
3. Vérifiez les permissions utilisateur
4. Contactez l'équipe technique

---

**Version** : 1.0  
**Dernière mise à jour** : Octobre 2025  
**Compatibilité** : Supabase, React, TypeScript
