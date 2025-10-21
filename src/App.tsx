import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import HomePage from './pages/HomePage';
import PropertiesPage from './pages/PropertiesPage';
import PropertyDetailPage from './pages/PropertyDetailPage';
import ServicesPage from './pages/ServicesPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ConsultationPage from './pages/ConsultationPage';
import PartnerForm from './pages/PartnerForm';
import PropertyForm from './components/Forms/PropertyForm';
import BookingForm from './components/Forms/BookingForm';
import HostForm from './components/Forms/HostForm';
import ProviderForm from './components/Forms/ProviderForm';
import DashboardPage from './pages/DashboardPage';
import ConfirmationPage from './pages/ConfirmationPage';
import MyReservationsPage from './pages/MyReservationsPage';

function App() {
  // Simulation d'un utilisateur connecté pour la démo
  const currentUser = null; // Changez à un objet utilisateur pour tester les états connectés
  const userType = 'owner'; // 'admin', 'owner', 'traveler', 'provider'

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

  return (
    <Router>
      <div className="min-h-screen bg-white flex flex-col">
        <Header currentUser={currentUser} userType={userType} />
        
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/properties" element={<PropertiesPage />} />
            <Route path="/property/:id" element={<PropertyDetailPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/consultation" element={<ConsultationPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/create-property" element={<PropertyForm />} />
            <Route path="/add-property" element={<PropertyForm />} />
            <Route path="/booking" element={<BookingForm />} />
            <Route path="/confirmation" element={<ConfirmationPage />} />
            <Route path="/my-reservations" element={<MyReservationsPage />} />
            <Route path="/become-host" element={<HostForm />} />
            <Route path="/become-partner" element={<PartnerForm />} />
            <Route path="/become-provider" element={<ProviderForm />} />
          </Routes>
        </main>
        
        <Footer />
      </div>
    </Router>
  );
}

export default App;