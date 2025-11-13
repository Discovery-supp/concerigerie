# Guide d'utilisation des messages personnalisés

## Système de notifications Toast

L'application utilise maintenant un système de notifications toast personnalisé pour remplacer tous les `alert()`.

## Comment utiliser

### 1. Importer le hook et les messages

```typescript
import { useToast } from '../../contexts/ToastContext';
import { messages } from '../../utils/messages';
```

### 2. Utiliser dans votre composant

```typescript
const MyComponent = () => {
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  const handleAction = async () => {
    try {
      // Votre logique
      showSuccess(messages.success.accountCreated);
    } catch (error) {
      showError(messages.error.generic);
    }
  };
};
```

## Messages disponibles

### Messages de succès
- `messages.success.accountCreated`
- `messages.success.reservationCreated`
- `messages.success.reservationConfirmed`
- `messages.success.propertyCreated`
- `messages.success.propertyPublished`
- etc.

### Messages d'erreur
- `messages.error.generic`
- `messages.error.unauthorized`
- `messages.error.reservationFailed`
- `messages.error.propertyLoadFailed`
- etc.

### Messages d'information
- `messages.info.redirectingToLogin`
- `messages.info.processing`
- etc.

### Messages d'avertissement
- `messages.warning.unsavedChanges`
- `messages.warning.deleteConfirmation`
- etc.

## Exemples de remplacement

### Avant (avec alert)
```typescript
alert('Réservation créée avec succès !');
```

### Après (avec toast)
```typescript
showSuccess(messages.success.reservationCreated);
```

### Avant (avec alert)
```typescript
alert('Erreur lors de la création: ' + error.message);
```

### Après (avec toast)
```typescript
showError(messages.error.reservationFailed + (error.message ? ` ${error.message}` : ''));
```

## Fichiers déjà modifiés

- ✅ `src/components/Booking/RealTimeBooking.tsx`
- ✅ `src/pages/RegisterPage.tsx` (déjà avec messages personnalisés)

## Fichiers à modifier

Les fichiers suivants contiennent encore des `alert()` et doivent être mis à jour :

1. `src/components/Dashboard/HostDashboard.tsx`
2. `src/components/Dashboard/OwnerDashboard.tsx`
3. `src/components/Dashboard/AdminDashboard.tsx`
4. `src/components/Forms/MessagingSystem.tsx`
5. `src/pages/MyReservationsPage.tsx`
6. `src/pages/AddPropertyPage.tsx`
7. `src/pages/PropertyManagementPage.tsx`
8. `src/components/Dashboard/PropertyAvailabilityManager.tsx`
9. `src/components/Admin/UserManagement.tsx`
10. `src/components/Admin/CreateUserModal.tsx`
11. `src/components/Forms/ReviewsForm.tsx`
12. `src/pages/PropertyDetailPage.tsx`
13. `src/components/Booking/PaymentModal.tsx`
14. `src/pages/PartnerForm.tsx`
15. `src/components/Forms/ProviderForm.tsx`
16. `src/components/Forms/HostForm.tsx`
17. `src/components/Forms/PropertyForm.tsx`
18. Et d'autres...

## Personnalisation des messages

Tous les messages sont centralisés dans `src/utils/messages.ts`. Vous pouvez :
- Modifier les messages existants
- Ajouter de nouveaux messages
- Personnaliser le ton et le style

