import React, { useState } from 'react';
import { Menu, X, User, Calendar, Home, Users, Settings, Bell } from 'lucide-react';
import Logo from '../../assets/logo.svg';

interface HeaderProps {
  currentUser?: any;
  userType?: string;
}

const Header: React.FC<HeaderProps> = ({ currentUser, userType }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

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
            <div className="flex-shrink-0">
              <img 
                src={Logo} 
                alt="Nzoo Immo" 
                className="h-12 w-auto"
              />
            </div>
          </div>

          {/* Navigation Desktop */}
          <nav className="hidden md:flex space-x-8">
            <a href="/" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
              Accueil
            </a>
            <a href="/properties" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
              Propriétés
            </a>
            <a href="/services" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
              Nos Services
            </a>
            <a href="/become-host" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
              Devenir Hôte
            </a>
            <a href="/become-partner" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
              Devenir Partenaire
            </a>
            <a href="/become-provider" className="text-secondary hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
              Devenir Prestataire
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {currentUser ? (
              <>
                {/* Notifications */}
                <button className="p-2 text-secondary hover:text-primary transition-colors">
                  <Bell className="w-5 h-5" />
                </button>

                {/* Dashboard Links */}
                {getMenuItems().length > 0 && (
                  <div className="hidden md:flex space-x-2">
                    {getMenuItems().map((item, index) => (
                      <a
                        key={index}
                        href={item.href}
                        className="flex items-center space-x-1 text-secondary hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors"
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </a>
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
                      <a href="/profile" className="block px-4 py-2 text-sm text-secondary hover:bg-gray-100">
                        Mon Profil
                      </a>
                      <a href="/logout" className="block px-4 py-2 text-sm text-secondary hover:bg-gray-100">
                        Déconnexion
                      </a>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex space-x-2">
                <a
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-secondary hover:text-primary transition-colors"
                >
                  Connexion
                </a>
                <a
                  href="/register"
                  className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-light transition-all shadow-md"
                >
                  Inscription
                </a>
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
            <a href="/" className="block px-3 py-2 text-secondary hover:text-primary hover:bg-gray-50 rounded-md">
              Accueil
            </a>
            <a href="/properties" className="block px-3 py-2 text-secondary hover:text-primary hover:bg-gray-50 rounded-md">
              Propriétés
            </a>
            <a href="/services" className="block px-3 py-2 text-secondary hover:text-primary hover:bg-gray-50 rounded-md">
              Nos Services
            </a>
            <a href="/become-host" className="block px-3 py-2 text-secondary hover:text-primary hover:bg-gray-50 rounded-md">
              Devenir Hôte
            </a>
            <a href="/become-partner" className="block px-3 py-2 text-secondary hover:text-primary hover:bg-gray-50 rounded-md">
              Devenir Partenaire
            </a>
            <a href="/become-provider" className="block px-3 py-2 text-secondary hover:text-primary hover:bg-gray-50 rounded-md">
              Devenir Prestataire
            </a>
            
            {currentUser && getMenuItems().map((item, index) => (
              <a
                key={index}
                href={item.href}
                className="flex items-center space-x-2 px-3 py-2 text-secondary hover:text-primary hover:bg-gray-50 rounded-md"
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;