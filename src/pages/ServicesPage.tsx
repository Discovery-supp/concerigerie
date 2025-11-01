import React from 'react';
import { Link } from 'react-router-dom';
import { Check, X } from 'lucide-react';

const ServicesPage: React.FC = () => {
  const services = [
    'La création de l\'annonce',
    'Multi diffusion de l\'annonce sur les principaux sites de réservations',
    'Gestion et optimisation des tarifs de location grâce au revenue management',
    'Communication et assistance aux voyageurs',
    'Gestion Réservations',
    'Reporting Mensuel',
    'Shooting standard',
    'Gestion des Entrées/Sorties',
    'Ménage & Maintenance Technique',
    'Entretien du linge et mise à disposition des consommables',
    'Encaissement des loyers',
    'Reporting Mensuel détaillé',
    'Shooting professionnelle',
    'Kit d\'accueil basique',
    'Rédaction livret d\'accueil et règlement',
    'Gestion des avis et performance de l\'annonce',
    'Kit d\'accueil prémium',
    'Stratégie marketing et storytelling'
  ];

  const packages = [
    {
      name: 'Forfait Essentielle',
      subtitle: 'Vous gérez l\'intendance, on s\'occupe du reste',
      commission: '15%',
      description: 'Un forfait pour les propriétaires débutants ou pour ceux qui souhaitent nous confier une gestion partielle de leur propriété.',
      services: {
        'La création de l\'annonce': 'included',
        'Multi diffusion de l\'annonce sur les principaux sites de réservations': 'included',
        'Gestion et optimisation des tarifs de location grâce au revenue management': 'additional',
        'Communication et assistance aux voyageurs': 'additional',
        'Gestion Réservations': 'additional',
        'Reporting Mensuel': 'included',
        'Shooting standard': 'included',
        'Gestion des Entrées/Sorties': 'additional',
        'Ménage & Maintenance Technique': 'additional',
        'Entretien du linge et mise à disposition des consommables': 'additional',
        'Encaissement des loyers': 'not-included',
        'Reporting Mensuel détaillé': 'additional',
        'Shooting professionnelle': 'additional',
        'Kit d\'accueil basique': 'additional',
        'Rédaction livret d\'accueil et règlement': 'additional',
        'Gestion des avis et performance de l\'annonce': 'included',
        'Kit d\'accueil prémium': 'additional',
        'Stratégie marketing et storytelling': 'additional'
      }
    },
    {
      name: 'Forfait Optimisée',
      subtitle: 'Laissez-nous tout gérer, du début à la fin',
      commission: '25%',
      description: 'Confiez la gestion locative de votre logement en toute sérénité avec notre formule la plus complète.',
      services: {
        'La création de l\'annonce': 'included',
        'Multi diffusion de l\'annonce sur les principaux sites de réservations': 'included',
        'Gestion et optimisation des tarifs de location grâce au revenue management': 'included',
        'Communication et assistance aux voyageurs': 'included',
        'Gestion Réservations': 'included',
        'Reporting Mensuel': 'additional',
        'Shooting standard': 'additional',
        'Gestion des Entrées/Sorties': 'included',
        'Ménage & Maintenance Technique': 'included',
        'Entretien du linge et mise à disposition des consommables': 'included',
        'Encaissement des loyers': 'not-included',
        'Reporting Mensuel détaillé': 'included',
        'Shooting professionnelle': 'included',
        'Kit d\'accueil basique': 'included',
        'Rédaction livret d\'accueil et règlement': 'included',
        'Gestion des avis et performance de l\'annonce': 'included',
        'Kit d\'accueil prémium': 'additional',
        'Stratégie marketing et storytelling': 'additional'
      }
    },
    {
      name: 'Forfait Prémium',
      subtitle: 'Pour une gestion exigeante et des services à la carte',
      commission: 'FFT',
      description: 'Un forfait pour les propriétaires ayant des propriétés particulières ou pour ceux qui souhaitent une gestion exigeante et des services à la carte.',
      services: {
        'La création de l\'annonce': 'included',
        'Multi diffusion de l\'annonce sur les principaux sites de réservations': 'included',
        'Gestion et optimisation des tarifs de location grâce au revenue management': 'included',
        'Communication et assistance aux voyageurs': 'included',
        'Gestion Réservations': 'included',
        'Reporting Mensuel': 'additional',
        'Shooting standard': 'additional',
        'Gestion des Entrées/Sorties': 'included',
        'Ménage & Maintenance Technique': 'included',
        'Entretien du linge et mise à disposition des consommables': 'included',
        'Encaissement des loyers': 'not-included',
        'Reporting Mensuel détaillé': 'included',
        'Shooting professionnelle': 'included',
        'Kit d\'accueil basique': 'additional',
        'Rédaction livret d\'accueil et règlement': 'included',
        'Gestion des avis et performance de l\'annonce': 'included',
        'Kit d\'accueil prémium': 'included',
        'Stratégie marketing et storytelling': 'included'
      }
    }
  ];

  const getServiceIcon = (status: string) => {
    switch (status) {
      case 'included':
        return <Check className="w-5 h-5 text-green-600" />;
      case 'additional':
        return <span className="text-orange-600 font-semibold text-sm">A</span>;
      case 'not-included':
        return <X className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getServiceLabel = (status: string) => {
    switch (status) {
      case 'included':
        return 'Inclus';
      case 'additional':
        return 'En option';
      case 'not-included':
        return 'Non inclus';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold font-heading text-primary mb-4">
            Nos Forfaits Conciergerie
          </h1>
          <p className="text-xl text-secondary max-w-3xl mx-auto">
            Découvrez nos offres complètes et choisissez la formule qui correspond le mieux à vos besoins
          </p>
        </div>

        {/* Légende */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold font-heading text-primary mb-4">Légende</h3>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center space-x-2">
              <Check className="w-5 h-5 text-green-600" />
              <span className="text-sm text-secondary">Service inclus</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-5 h-5 bg-orange-600 text-white rounded flex items-center justify-center text-xs font-semibold">A</span>
              <span className="text-sm text-secondary">Service additionnel (en option)</span>
            </div>
            <div className="flex items-center space-x-2">
              <X className="w-5 h-5 text-red-500" />
              <span className="text-sm text-secondary">Service non inclus</span>
            </div>
          </div>
        </div>

        {/* Tableau comparatif */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-primary text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold font-heading">
                    Nos services
                  </th>
                  {packages.map((pkg, index) => (
                    <th key={index} className="px-6 py-4 text-center font-semibold font-heading min-w-64">
                      <div className="space-y-2">
                        <div className="text-lg">{pkg.name}</div>
                        <div className="text-sm opacity-90">{pkg.subtitle}</div>
                        <div className="text-2xl font-bold">{pkg.commission}</div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {services.map((service, serviceIndex) => (
                  <tr key={serviceIndex} className={serviceIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-6 py-4 text-secondary font-medium border-r border-light-gray">
                      {service}
                    </td>
                    {packages.map((pkg, pkgIndex) => (
                      <td key={pkgIndex} className="px-6 py-4 text-center border-r border-light-gray">
                        <div className="flex flex-col items-center space-y-1">
                          {getServiceIcon(pkg.services[service] || 'not-included')}
                          <span className="text-xs text-secondary">
                            {getServiceLabel(pkg.services[service] || 'not-included')}
                          </span>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Descriptions des forfaits */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
          {packages.map((pkg, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-lg p-8">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold font-heading text-primary mb-2">
                  {pkg.name}
                </h3>
                <p className="text-secondary text-sm mb-4">
                  {pkg.subtitle}
                </p>
                <div className="text-3xl font-bold text-primary">
                  {pkg.commission}
                </div>
                {pkg.commission !== 'FFT' && (
                  <span className="text-secondary text-sm">commission</span>
                )}
              </div>
              
              <p className="text-secondary text-sm leading-relaxed mb-6">
                {pkg.description}
              </p>

              <button className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-light transition-colors">
                <a href={`/become-host?package=${encodeURIComponent(pkg.name.toLowerCase().replace(/\s+/g, '-'))}&commission=${encodeURIComponent(pkg.commission)}`}>
                  Choisir ce forfait
                </a>
              </button>
            </div>
          ))}
        </div>

        {/* Note FFT */}
        <div className="text-center mt-8">
          <p className="text-secondary text-sm">
            * FFT : Forfait à la carte négociable selon vos besoins spécifiques
          </p>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-primary via-primary-light to-secondary rounded-3xl p-12 text-center mt-16">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-3xl font-bold font-heading text-white mb-4">
              Prêt à commencer ?
            </h3>
            <p className="text-gray-200 text-lg mb-8">
              Contactez-nous pour discuter de vos besoins et choisir le forfait qui vous convient le mieux.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/consultation"
                className="px-8 py-4 bg-white text-primary font-semibold rounded-lg hover:bg-gray-100 transition-all shadow-lg"
              >
                Consultation Gratuite
              </Link>
              <Link
                to="/become-host"
                className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-lg hover:bg-white/30 transition-all border border-white/30"
              >
                Devenir Hôte
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicesPage;