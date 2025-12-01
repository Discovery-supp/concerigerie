# Guide pour afficher les réservations dans le dashboard

## Problème
Les réservations ne s'affichent pas dans la section "Réservations actuelles" du dashboard.

## Solutions en 3 étapes

### Étape 1: Appliquer les politiques RLS ✅

**Exécutez le script SQL suivant dans Supabase SQL Editor:**

```sql
-- Fichier: FIX_RESERVATIONS_RLS.sql
```

Ce script configure les politiques RLS pour que:
- Les **Guests** (voyageurs) puissent voir leurs propres réservations
- Les **Hosts** (propriétaires) puissent voir les réservations de leurs propriétés

### Étape 2: Vérifier les données

**Exécutez le script de diagnostic:**

```sql
-- Fichier: TEST_AND_FIX_RESERVATIONS_DISPLAY.sql
```

Ce script vous indiquera:
- Si RLS est activé
- Si les politiques sont créées
- S'il y a des réservations dans la base
- S'il y a des problèmes de relations (guest_id, property_id)

### Étape 3: Créer des réservations de test (si nécessaire)

Si vous n'avez pas de réservations, créez-en avec ce script:

```sql
-- Créer une réservation de test
-- Remplacez les UUIDs par de vrais IDs de votre base

-- 1. Vérifier qu'il y a un guest (utilisateur de type 'traveler')
SELECT id, email, user_type 
FROM user_profiles 
WHERE user_type = 'traveler' 
LIMIT 1;

-- 2. Vérifier qu'il y a une propriété publiée
SELECT id, title, owner_id, is_published 
FROM properties 
WHERE is_published = true 
LIMIT 1;

-- 3. Créer une réservation de test
-- Remplacez 'GUEST_ID' et 'PROPERTY_ID' par les vrais IDs
INSERT INTO reservations (
  guest_id,
  property_id,
  check_in,
  check_out,
  adults,
  children,
  total_amount,
  status,
  payment_status
) VALUES (
  'GUEST_ID',  -- Remplacez par l'ID du guest
  'PROPERTY_ID',  -- Remplacez par l'ID de la propriété
  CURRENT_DATE + INTERVAL '7 days',  -- Check-in dans 7 jours
  CURRENT_DATE + INTERVAL '10 days',  -- Check-out dans 10 jours
  2,  -- 2 adultes
  0,  -- 0 enfants
  500.00,  -- Montant total
  'confirmed',  -- Statut confirmé
  'paid'  -- Paiement effectué
);
```

## Vérification dans le navigateur

1. **Ouvrez la console du navigateur (F12)**
2. **Allez dans l'onglet "Réservations" du dashboard**
3. **Vérifiez les messages dans la console:**
   - `[MyReservations] guest_id: ...` - Doit afficher votre ID utilisateur
   - `[MyReservations] reservations loaded: X` - Doit afficher le nombre de réservations
   - S'il y a des erreurs, elles seront affichées ici

## Problèmes courants et solutions

### Problème 1: "Aucune réservation" même avec des réservations en base

**Cause:** Les politiques RLS bloquent l'accès

**Solution:**
1. Exécutez `FIX_RESERVATIONS_RLS.sql`
2. Vérifiez que vous êtes bien connecté avec le bon compte (guest_id doit correspondre)

### Problème 2: Les réservations ne s'affichent pas pour les Hosts

**Cause:** La requête utilise `property.owner_id` mais les politiques RLS ne permettent peut-être pas cette jointure

**Solution:**
1. Vérifiez que les propriétés ont bien un `owner_id` qui correspond à votre ID utilisateur
2. Exécutez `FIX_RESERVATIONS_RLS.sql` pour s'assurer que les politiques permettent aux hosts de voir les réservations

### Problème 3: Erreur "permission denied"

**Cause:** Les politiques RLS ne sont pas correctement configurées

**Solution:**
1. Exécutez `FIX_RESERVATIONS_RLS.sql`
2. Vérifiez dans Supabase Dashboard → Authentication → Policies que les politiques sont créées

### Problème 4: Les réservations s'affichent mais sans détails de propriété

**Cause:** La jointure avec `properties` ne fonctionne pas à cause de RLS

**Solution:**
1. Vérifiez que les politiques RLS sur `properties` permettent de voir les propriétés publiées
2. Vérifiez que `property_id` dans `reservations` correspond à un ID valide dans `properties`

## Test rapide

Pour tester rapidement si tout fonctionne:

```sql
-- Se connecter en tant que guest et tester la vue
-- (Remplacez 'YOUR_USER_ID' par votre ID utilisateur)
SELECT 
  r.*,
  p.title as property_title,
  p.address as property_address
FROM reservations r
LEFT JOIN properties p ON r.property_id = p.id
WHERE r.guest_id = 'YOUR_USER_ID'
ORDER BY r.created_at DESC;
```

Si cette requête retourne des résultats, les politiques RLS fonctionnent correctement.

## Commandes utiles

### Voir toutes les réservations (en tant qu'admin)
```sql
SELECT 
  r.id,
  r.guest_id,
  r.property_id,
  r.status,
  r.check_in,
  r.check_out,
  r.total_amount,
  up.email as guest_email,
  p.title as property_title
FROM reservations r
LEFT JOIN user_profiles up ON r.guest_id = up.id
LEFT JOIN properties p ON r.property_id = p.id
ORDER BY r.created_at DESC;
```

### Voir les réservations d'un guest spécifique
```sql
-- Remplacez 'GUEST_ID' par l'ID du guest
SELECT * FROM reservations WHERE guest_id = 'GUEST_ID';
```

### Voir les réservations d'un host spécifique
```sql
-- Remplacez 'HOST_ID' par l'ID du host
SELECT 
  r.*,
  p.title as property_title
FROM reservations r
JOIN properties p ON r.property_id = p.id
WHERE p.owner_id = 'HOST_ID';
```

## Support

Si les problèmes persistent:
1. Vérifiez les logs dans la console du navigateur (F12)
2. Vérifiez les logs dans Supabase Dashboard → Logs
3. Exécutez `TEST_AND_FIX_RESERVATIONS_DISPLAY.sql` pour un diagnostic complet

