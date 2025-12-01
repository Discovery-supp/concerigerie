import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Facebook, Instagram, Linkedin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-primary text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo et description */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold font-heading text-white">
              N'zoo Immo Conciergerie
            </h3>
            <p className="text-sm leading-relaxed">
              Conciergerie Airbnb Premium en RD Congo. Nous transformons votre bien immobilier
              en une source de revenus optimisée et sécurisée. Tout en offrant aux voyageurs
              un service d'hébergement de qualité supérieure.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold font-heading text-white">Nos Services</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/services" className="hover:text-white transition-colors">Gestion Complète</Link></li>
              <li><Link to="/services" className="hover:text-white transition-colors">Photographie Professionnelle</Link></li>
              <li><Link to="/services" className="hover:text-white transition-colors">Conciergerie Voyageurs</Link></li>
              <li><Link to="/services" className="hover:text-white transition-colors">Services Additionnels</Link></li>
              <li><Link to="/become-partner" className="hover:text-white transition-colors">Partenariats</Link></li>
            </ul>
          </div>

          {/* Liens utiles */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold font-heading text-white">Liens Utiles</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/become-host" className="hover:text-white transition-colors">Devenir Hôte</Link></li>
              <li><Link to="/become-partner" className="hover:text-white transition-colors">Devenir Partenaire</Link></li>
              <li><Link to="/become-provider" className="hover:text-white transition-colors">Devenir Prestataire</Link></li>
              <li><Link to="/services" className="hover:text-white transition-colors">Nos Forfaits</Link></li>
              <li><Link to="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold font-heading text-white">Contact</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-white" />
                <span>Kinshasa, RDC</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-white" />
                <span>+243 XXX XXX XXX</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-white" />
                <span>contact@nzooimmo.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Séparateur */}
        <div className="border-t border-primary-light mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-gray-400">
              © 2025 Nzoo Immo Conciergerie. Tous droits réservés.
            </p>
            <div className="flex space-x-6 text-sm">
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                Conditions d'utilisation
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                Politique de confidentialité
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                Mentions légales
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;