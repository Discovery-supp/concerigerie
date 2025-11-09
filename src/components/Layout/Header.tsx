import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, Calendar, Home, Users, Settings, Bell } from 'lucide-react';
import Logo from '../../assets/logo.svg';

interface HeaderProps {
  currentUser?: any;
  userType?: string;
}

const Header: React.FC<HeaderProps> = ({ currentUser, userType }) => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const isDashboardPage = location.pathname.includes('/dashboard');

  const getMenuItems = () => {
    if (!currentUser) return [];
    
    switch (userType) {
      case 'admin':
        return [
          { icon: Home, label: 'Propriétés', href: '/admin/properties' },
          { icon: Calendar, label: 'Réservations', href: '/admin/reservations' },
          { icon: Users, label: 'Utilisateurs', href: '/admin/users' },
          { icon: Settings, label: 'Paramètres', href: '/admin/settings' },
        ];
      case 'owner':
        return [
          { icon: Home, label: 'Mes Propriétés', href: '/owner/properties' },
          { icon: Calendar, label: 'Calendrier', href: '/owner/calendar' },
          { icon: Settings, label: 'Paramètres', href: '/owner/settings' },
        ];
      default:
        return [];
    }
  };

  return (
    <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0">
              <img 
                src={Logo} 
                alt="Nzoo Immo" 
                className="h-12 w-auto"
              />
            </Link>
          </div>

          {/* Navigation Desktop - Masquer sur les pages dashboard */}
          {!isDashboardPage && (
            <nav className="hidden md:flex space-x-8">
              <Link to="/" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Accueil
              </Link>
              <Link to="/properties" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Propriétés
              </Link>
              <Link to="/services" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Nos Services
              </Link>
              <Link to="/become-host" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Devenir Hôte
              </Link>
              <Link to="/become-partner" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Devenir Partenaire
              </Link>
              <Link to="/become-provider" className="text-secondary hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Devenir Prestataire
              </Link>
            </nav>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {currentUser ? (
              <>
                {/* Notifications */}
                <button className="p-2 text-secondary hover:text-primary transition-colors">
                  <Bell className="w-5 h-5" />
                </button>

                {/* Dashboard Links - Masquer sur les pages dashboard */}
                {getMenuItems().length > 0 && !isDashboardPage && (
                  <div className="hidden md:flex space-x-2">
                    {getMenuItems().map((item, index) => (
                      <Link
                        key={index}
                        to={item.href}
                        className="flex items-center space-x-1 text-secondary hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors"
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                )}

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 text-secondary hover:text-primary p-2 rounded-full transition-colors"
                  >
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="hidden md:block text-sm font-medium">
                      {currentUser.firstName}
                    </span>
                  </button>
                  
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border border-light-gray">
                      <Link to="/settings" className="block px-4 py-2 text-sm text-secondary hover:bg-gray-100">
                        Paramètres
                      </Link>
                      <Link to="/profile" className="block px-4 py-2 text-sm text-secondary hover:bg-gray-100">
                        Mon Profil
                      </Link>
                      <Link to="/logout" className="block px-4 py-2 text-sm text-secondary hover:bg-gray-100">
                        Déconnexion
                      </Link>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-secondary hover:text-primary transition-colors"
                >
                  Connexion
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-light transition-all shadow-md"
                >
                  Inscription
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-md text-secondary hover:text-primary transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-light-gray">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link to="/" className="block px-3 py-2 text-secondary hover:text-primary hover:bg-gray-50 rounded-md">
              Accueil
            </Link>
            <Link to="/properties" className="block px-3 py-2 text-secondary hover:text-primary hover:bg-gray-50 rounded-md">
              Propriétés
            </Link>
            <Link to="/services" className="block px-3 py-2 text-secondary hover:text-primary hover:bg-gray-50 rounded-md">
              Nos Services
            </Link>
            <Link to="/become-host" className="block px-3 py-2 text-secondary hover:text-primary hover:bg-gray-50 rounded-md">
              Devenir Hôte
            </Link>
            <Link to="/become-partner" className="block px-3 py-2 text-secondary hover:text-primary hover:bg-gray-50 rounded-md">
              Devenir Partenaire
            </Link>
            <Link to="/become-provider" className="block px-3 py-2 text-secondary hover:text-primary hover:bg-gray-50 rounded-md">
              Devenir Prestataire
            </Link>
            
            {currentUser && getMenuItems().map((item, index) => (
              <Link
                key={index}
                to={item.href}
                className="flex items-center space-x-2 px-3 py-2 text-secondary hover:text-primary hover:bg-gray-50 rounded-md"
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;