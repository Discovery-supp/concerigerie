import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { ToastContainer } from './components/Common/Toast';
import HomePage from './pages/HomePage';
import PropertiesPage from './pages/PropertiesPage';
import AddPropertyPage from './pages/AddPropertyPage';
import PropertyDetailPage from './pages/PropertyDetailPage';
import ServicesPage from './pages/ServicesPage';
import ServiceProvidersSearchPage from './pages/ServiceProvidersSearchPage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import RegisterPage from './pages/RegisterPage';
import TravelerRegisterPage from './pages/TravelerRegisterPage';
import ConsultationPage from './pages/ConsultationPage';
import PartnerForm from './pages/PartnerForm';
import PropertyForm from './components/Forms/PropertyForm';
import BookingForm from './components/Forms/BookingForm';
import HostForm from './components/Forms/HostForm';
import ProviderForm from './components/Forms/ProviderForm';
import DashboardPage from './pages/DashboardPage';
import ConfirmationPage from './pages/ConfirmationPage';
import MyReservationsPage from './pages/MyReservationsPage';
import MessagingPage from './pages/MessagingPage';
import PropertyManagementPage from './pages/PropertyManagementPage';
import SettingsPage from './pages/SettingsPage';
import OwnerSettingsPage from './pages/OwnerSettingsPage';
import ReviewsPage from './pages/ReviewsPage';
import { supabase } from './lib/supabase';

// Composant pour afficher les toasts
const ToastWrapper: React.FC = () => {
  const { toasts, removeToast } = useToast();
  return <ToastContainer toasts={toasts} onClose={removeToast} />;
};

// Composant interne pour gérer l'affichage conditionnel du Header/Footer
type HeaderUser = {
  id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  role?: string;
};

const AppContent: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<HeaderUser | null>(null);
  const [userType, setUserType] = useState<string | null>(null);

  // Pages où on ne veut pas afficher le Header et Footer (pages de compte)
  const accountPages = [
    '/dashboard',
    '/settings',
    '/owner/settings',
    '/messaging',
    '/manage-properties',
    '/my-reservations',
    '/analytics',
    '/reservations'
  ];

  const isAccountPage = accountPages.some(page => location.pathname.startsWith(page));

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        // Gérer les erreurs 403 (Forbidden)
        if (userError) {
          if (userError.status === 403 || userError.message?.includes('Forbidden') ||
              userError.message?.includes('JWT') || userError.message?.includes('token')) {
            console.warn('[App] Erreur d\'authentification (403), nettoyage...');
            try {
              localStorage.removeItem('supabase.auth.token');
              await supabase.auth.signOut();
            } catch (signOutError) {
              console.error('Erreur lors de la déconnexion:', signOutError);
              localStorage.removeItem('supabase.auth.token');
            }
            setCurrentUser(null);
            setUserType(null);
            return;
          }
          // Pour les autres erreurs, continuer sans utilisateur
          setCurrentUser(null);
          setUserType(null);
          return;
        }

        if (!user) {
          setCurrentUser(null);
          setUserType(null);
          return;
        }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('first_name,last_name,email,user_type')
        .eq('id', user.id)
        .maybeSingle();

      const firstName =
        profile?.first_name ||
        user.user_metadata?.firstName ||
        user.user_metadata?.first_name ||
        user.user_metadata?.given_name ||
        'Utilisateur';

      const lastName =
        profile?.last_name ||
        user.user_metadata?.lastName ||
        user.user_metadata?.last_name ||
        user.user_metadata?.family_name ||
        '';

      const role =
        profile?.user_type ||
        user.user_metadata?.userType ||
        user.user_metadata?.user_type ||
        'traveler';

      setCurrentUser({
        id: user.id,
        firstName,
        lastName,
        email: profile?.email || user.email || '',
        role
      });
      setUserType(role);
      } catch (error: any) {
        console.error('[App] Erreur chargement utilisateur:', error);
        if (error?.status === 403 || error?.message?.includes('Forbidden')) {
          try {
            localStorage.removeItem('supabase.auth.token');
            await supabase.auth.signOut();
          } catch (signOutError) {
            console.error('Erreur lors de la déconnexion:', signOutError);
          }
        }
        setCurrentUser(null);
        setUserType(null);
      }
    };

    loadCurrentUser();

    const { data: authSubscription } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Gérer les erreurs de refresh token
      if (event === 'TOKEN_REFRESHED' && !session) {
        // Token invalide, déconnecter l'utilisateur
        console.warn('Token invalide, déconnexion...');
        try {
          localStorage.removeItem('supabase.auth.token');
          await supabase.auth.signOut();
        } catch (error) {
          console.error('Erreur lors de la déconnexion:', error);
          localStorage.removeItem('supabase.auth.token');
        }
        setCurrentUser(null);
        setUserType(null);
        if (location.pathname !== '/login' && location.pathname !== '/') {
          navigate('/login');
        }
        return;
      }

      // Gérer les erreurs d'authentification
      if (event === 'SIGNED_OUT' || !session) {
        setCurrentUser(null);
        setUserType(null);
        return;
      }

      loadCurrentUser();
    });

    // Vérifier périodiquement si la session est toujours valide
    // Cela permet de détecter les erreurs de refresh token qui ne déclenchent pas d'événement
    const sessionCheckInterval = setInterval(async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        // Si on a une erreur de refresh token, nettoyer
        if (error && (error.message?.includes('Refresh Token') || 
                      error.message?.includes('Invalid Refresh Token'))) {
          console.warn('Session invalide détectée, déconnexion...');
          try {
            localStorage.removeItem('supabase.auth.token');
            await supabase.auth.signOut();
          } catch (signOutError) {
            console.error('Erreur lors de la déconnexion:', signOutError);
            localStorage.removeItem('supabase.auth.token');
          }
          setCurrentUser(null);
          setUserType(null);
          if (location.pathname !== '/login' && location.pathname !== '/') {
            navigate('/login');
          }
        } else if (!currentSession) {
          // Session perdue, nettoyer l'état si nécessaire
          setCurrentUser(prev => {
            if (prev) {
              setUserType(null);
              return null;
            }
            return prev;
          });
        }
      } catch (err) {
        // Ignorer les erreurs silencieuses de vérification
        console.debug('Erreur vérification session:', err);
      }
    }, 60000); // Vérifier toutes les minutes

    // Gestionnaire d'erreur global pour les erreurs de refresh token
    const handleAuthError = async (error: any) => {
      const errorMessage = error?.message || error?.error_description || error?.toString() || '';
      const isRefreshTokenError = 
        errorMessage.includes('Refresh Token') || 
        errorMessage.includes('Invalid Refresh Token') ||
        errorMessage.includes('Refresh Token Not Found') ||
        errorMessage.includes('token') && (error?.status === 400 || error?.code === 'invalid_grant') ||
        error?.name === 'AuthApiError' && errorMessage.includes('token');

      if (isRefreshTokenError) {
        console.warn('Erreur de refresh token détectée, déconnexion automatique...', error);
        try {
          // Nettoyer le localStorage
          localStorage.removeItem('supabase.auth.token');
          // Déconnecter
          await supabase.auth.signOut();
        } catch (signOutError) {
          console.error('Erreur lors de la déconnexion:', signOutError);
          // Forcer le nettoyage même si signOut échoue
          localStorage.removeItem('supabase.auth.token');
        }
        setCurrentUser(null);
        setUserType(null);
        if (location.pathname !== '/login' && location.pathname !== '/') {
          navigate('/login');
        }
      }
    };

    // Écouter les erreurs non gérées (promesses rejetées)
    const unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
      handleAuthError(event.reason);
      // Empêcher l'affichage de l'erreur dans la console si c'est une erreur de refresh token
      if (event.reason?.message?.includes('Refresh Token')) {
        event.preventDefault();
      }
    };

    // Écouter les erreurs JavaScript générales
    const errorHandler = (event: ErrorEvent) => {
      handleAuthError(event.error);
    };

    window.addEventListener('unhandledrejection', unhandledRejectionHandler);
    window.addEventListener('error', errorHandler);

    return () => {
      authSubscription?.subscription.unsubscribe();
      window.removeEventListener('unhandledrejection', unhandledRejectionHandler);
      window.removeEventListener('error', errorHandler);
      clearInterval(sessionCheckInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {!isAccountPage && <Header currentUser={currentUser || undefined} userType={userType || undefined} />}
      
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/properties" element={<PropertiesPage />} />
          <Route path="/property/:id" element={<PropertyDetailPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/service-providers" element={<ServiceProvidersSearchPage />} />
          <Route path="/consultation" element={<ConsultationPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/traveler-register" element={<TravelerRegisterPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/create-property" element={<PropertyForm />} />
          <Route path="/add-property" element={<AddPropertyPage />} />
          <Route path="/booking" element={<BookingForm />} />
          <Route path="/confirmation" element={<ConfirmationPage />} />
          <Route path="/my-reservations" element={<MyReservationsPage />} />
          <Route path="/manage-properties" element={<PropertyManagementPage />} />
          <Route path="/messaging" element={<MessagingPage />} />
          <Route path="/become-host" element={<HostForm />} />
          <Route path="/become-partner" element={<PartnerForm />} />
          <Route path="/become-provider" element={<ProviderForm />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/owner/settings" element={<OwnerSettingsPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
        </Routes>

        {/* Bouton flottant de retour au tableau de bord pour les pages compte */}
        {isAccountPage && (
          <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-2">
            <div className="flex gap-2">
              <a
                href="/"
                className="px-4 py-3 rounded-full shadow-lg bg-gray-700 hover:bg-gray-800 text-white text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                aria-label="Aller à l’accueil"
              >
                Accueil
              </a>
              <button
                onClick={async () => {
                  try {
                    await supabase.auth.signOut();
                  } catch {}
                  navigate('/');
                }}
                className="px-4 py-3 rounded-full shadow-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                aria-label="Se déconnecter et revenir à l’accueil"
              >
                Déconnexion
              </button>
            </div>
            <a
              href="/dashboard"
              className="px-4 py-3 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              aria-label="Retour au tableau de bord"
            >
              ← Retour au tableau de bord
            </a>
          </div>
        )}
      </main>
      
      {!isAccountPage && <Footer />}
      
      {/* Container pour les notifications toast */}
      <ToastWrapper />
    </div>
  );
};

function App() {
  // Gestion de l'authentification OAuth
  useEffect(() => {
    const handleOAuthCallback = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      
      if (code && state) {
        // Traitement du callback OAuth
        console.log('OAuth callback received:', { code, state });
        // Ici vous pourriez appeler votre API pour échanger le code contre un token
      }
    };

    handleOAuthCallback();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      supabase.auth.signOut();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return (
    <ToastProvider>
      <Router>
        <AppContent />
      </Router>
    </ToastProvider>
  );
}

export default App;