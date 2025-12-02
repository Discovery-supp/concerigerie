// Messages personnalisés pour toute l'application N'zoo Immo

export const messages = {
  // Messages de succès
  success: {
    accountCreated: "Votre compte a été créé avec succès ! Vérifiez votre email pour confirmer votre compte avant de vous connecter.",
    loginSuccess: "Connexion réussie ! Bienvenue sur N'zoo Immo.",
    reservationCreated: "Réservation créée avec succès ! Elle est maintenant en attente de confirmation par l'hôte.",
    reservationConfirmed: "Réservation confirmée automatiquement ! Vous pouvez consulter les détails dans vos réservations.",
    reservationConfirmedByHost: "Réservation confirmée avec succès ! Le client a été notifié.",
    bookNowTraveler: "Réserver maintenant ! Votre réservation a été créée avec succès.",
    bookNowHost: "Nouvelle réservation ! Réservez maintenant pour confirmer cette demande.",
    reservationCancelled: "Votre demande d'annulation a été envoyée à l'administration. Vous serez notifié de la décision.",
    cancellationApproved: "Annulation approuvée et remboursement effectué.",
    cancellationDenied: "Demande d'annulation refusée.",
    propertyCreated: "Annonce créée avec succès !",
    propertyPublished: "Annonce créée et publiée avec succès !",
    propertyUnpublished: "Annonce retirée de la publication. Vous pourrez la supprimer définitivement après avoir géré les réservations/avis associés.",
    propertyDeleted: "Propriété et éléments liés supprimés.",
    propertyUpdated: "Propriété mise à jour avec succès !",
    availabilityUpdated: "Disponibilité mise à jour avec succès !",
    reviewSubmitted: "Votre avis a été soumis avec succès ! Merci pour votre retour.",
    messageSent: "Message envoyé avec succès !",
    userCreated: "Utilisateur créé avec succès !",
    userDeleted: "Utilisateur supprimé avec succès !",
    profileUpdated: "Profil mis à jour avec succès !",
    hostApplicationSubmitted: "Inscription hôte réussie ! Vérifiez votre email pour confirmer votre compte.",
    partnerApplicationSubmitted: "Candidature partenaire soumise avec succès ! Nous vous recontacterons sous 48h.",
    providerApplicationSubmitted: "Candidature prestataire soumise avec succès ! Nous examinerons votre dossier sous 48h.",
    paymentSuccess: "Paiement effectué avec succès !",
    locationFound: "Localisation trouvée ! Vous pouvez voir l'emplacement sur la carte.",
    adminAccountCreated: "Le compte administrateur a été créé avec succès !",
  },

  // Messages d'erreur
  error: {
    generic: "Une erreur est survenue. Veuillez réessayer.",
    networkError: "Erreur de connexion. Vérifiez votre connexion internet.",
    unauthorized: "Vous devez être connecté pour effectuer cette action.",
    forbidden: "Vous n'avez pas les permissions nécessaires pour cette action.",
    notFound: "L'élément recherché n'a pas été trouvé.",
    
    // Authentification
    loginFailed: "Email ou mot de passe incorrect. Veuillez réessayer.",
    accountCreationFailed: "Erreur lors de la création du compte. Veuillez réessayer.",
    emailAlreadyExists: "Cet email est déjà utilisé. Veuillez vous connecter ou utiliser un autre email.",
    invalidEmail: "L'adresse email n'est pas valide.",
    invalidPassword: "Le mot de passe ne respecte pas les critères requis.",
    passwordMismatch: "Les mots de passe ne correspondent pas.",
    sessionExpired: "Votre session a expiré. Veuillez vous reconnecter.",
    
    // Réservations
    reservationFailed: "Erreur lors de la création de la réservation. Veuillez réessayer.",
    reservationNotFound: "Réservation introuvable.",
    reservationConflict: "Ces dates ne sont pas disponibles. Veuillez choisir d'autres dates.",
    cancellationFailed: "Erreur lors de la demande d'annulation. Veuillez réessayer.",
    confirmationFailed: "Erreur lors de la confirmation de la réservation.",
    
    // Propriétés
    propertyLoadFailed: "Erreur lors du chargement de la propriété. Veuillez réessayer.",
    propertyCreationFailed: "Erreur lors de la création de l'annonce. Veuillez réessayer.",
    propertyUpdateFailed: "Erreur lors de la mise à jour de la propriété.",
    propertyDeleteFailed: "Impossible d'exécuter la suppression. Contactez l'admin si le problème persiste.",
    propertyPublishFailed: "Erreur lors de la publication de l'annonce.",
    propertyUnpublishFailed: "Impossible de retirer l'annonce. Contactez l'admin si le problème persiste.",
    availabilityUpdateFailed: "Erreur lors de la mise à jour de la disponibilité.",
    dateAlreadyReserved: "Cette date est déjà réservée et ne peut pas être modifiée.",
    
    // Photos
    tooManyPhotos: "Vous ne pouvez ajouter que 8 photos maximum.",
    photoUploadFailed: "Erreur lors de l'upload des photos. Veuillez réessayer.",
    fileTooLarge: "Le fichier dépasse la taille maximale de 10MB.",
    invalidFileType: "Le fichier n'est pas un format accepté (JPG ou PNG uniquement).",
    mustBeLoggedIn: "Veuillez vous connecter pour ajouter des photos.",
    
    // Messages
    messageSendFailed: "Erreur lors de l'envoi du message. Veuillez réessayer.",
    recipientNotFound: "Destinataire introuvable. Veuillez réessayer.",
    emptyMessage: "Veuillez saisir un message.",
    noRecipient: "Veuillez sélectionner un destinataire et saisir un message.",
    adminOnlyCommunication: "Vous ne pouvez communiquer qu'avec l'administration.",
    
    // Avis
    reviewSubmissionFailed: "Erreur lors de la soumission de l'avis. Veuillez réessayer.",
    
    // Utilisateurs
    userCreationFailed: "Erreur lors de la création de l'utilisateur.",
    userDeleteFailed: "Erreur lors de la suppression de l'utilisateur.",
    
    // Paiements
    paymentFailed: "Erreur lors du paiement. Veuillez réessayer.",
    paymentMethodRequired: "Veuillez sélectionner un mode de paiement.",
    
    // Localisation
    locationNotFound: "Adresse non trouvée. Veuillez vérifier l'adresse.",
    locationSearchFailed: "Erreur lors de la recherche de l'adresse.",
    
    // Formulaires
    requiredFieldsMissing: "Veuillez remplir tous les champs obligatoires.",
    termsNotAccepted: "Vous devez accepter les conditions générales.",
  },

  // Messages d'information
  info: {
    redirectingToLogin: "Redirection vers la page de connexion dans quelques secondes...",
    checkingAvailability: "Vérification de la disponibilité...",
    processing: "Traitement en cours...",
    loading: "Chargement...",
    featureInDevelopment: "Cette fonctionnalité est en cours de développement.",
    receiptDownloadSoon: "Le téléchargement du reçu sera disponible prochainement.",
    reservationPending: "Votre réservation est en attente de confirmation par l'hôte.",
    accountConfirmationRequired: "Vérifiez votre email pour confirmer votre compte avant de vous connecter.",
  },

  // Messages d'avertissement
  warning: {
    unsavedChanges: "Vous avez des modifications non enregistrées. Êtes-vous sûr de vouloir quitter ?",
    deleteConfirmation: "Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.",
    cancelReservation: "Êtes-vous sûr de vouloir annuler cette réservation ?",
  },

  // Messages de validation
  validation: {
    emailRequired: "L'adresse email est requise.",
    passwordRequired: "Le mot de passe est requis.",
    passwordMinLength: "Le mot de passe doit contenir au moins 8 caractères.",
    phoneRequired: "Le numéro de téléphone est requis.",
    nameRequired: "Le nom est requis.",
    firstNameRequired: "Le prénom est requis.",
    lastNameRequired: "Le nom de famille est requis.",
  }
};

// Fonction helper pour obtenir un message avec fallback
export const getMessage = (category: keyof typeof messages, key: string, fallback?: string): string => {
  const categoryMessages = messages[category] as Record<string, string>;
  return categoryMessages[key] || fallback || messages.error.generic;
};

