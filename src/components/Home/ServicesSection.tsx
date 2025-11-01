import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Camera, Users, Wrench, Star, Shield, Clock, TrendingUp } from 'lucide-react';

const ServicesSection: React.FC = () => {
  const services = [
    {
      icon: Home,
      title: "Gestion Complète Clé en Main",
      description: "Création de l'annonce, optimisation, gestion des réservations et de la communication.",
      category: "Gestion"
    },
    {
      icon: Camera,
      title: "Photographie Professionnelle",
      description: "Mise en valeur immobilière de votre bien pour attirer plus de voyageurs.",
      category: "Marketing"
    },
    {
      icon: Users,
      title: "Gestion des Entrées/Sorties",
      description: "Accueil personnalisé des voyageurs, remise des clés, état des lieux.",
      category: "Service"
    },
    {
      icon: Wrench,
      title: "Ménage & Maintenance",
      description: "Nettoyage approfondi après chaque départ et coordination avec des artisans de confiance.",
      category: "Maintenance"
    },
    {
      icon: TrendingUp,
      title: "Reporting Financier",
      description: "Relevé de compte mensuel détaillé avec tous les revenus et les frais.",
      category: "Finances"
    },
    {
      icon: Shield,
      title: "Service de Conciergerie",
      description: "Support continu 7j/7, recommandations locales sur-mesure, aide logistique.",
      category: "Support"
    }
  ];

  const packages = [
    {
      name: "Forfait Essentielle",
      subtitle: "Vous gérez l'intendance, on s'occupe du reste",
      commission: "15%",
      description: "Un forfait pour les propriétaires débutants ou pour ceux qui souhaitent nous confier une gestion partielle.",
      features: [
        "Création de l'annonce",
        "Multi diffusion",
        "Shooting standard",
        "Gestion des avis",
        "Reporting mensuel"
      ],
      popular: false
    },
    {
      name: "Forfait Optimisée",
      subtitle: "Laissez-nous tout gérer, du début à la fin",
      commission: "25%",
      description: "Confiez la gestion locative de votre logement en toute sérénité avec notre formule complète.",
      features: [
        "Tous les services Essentielle",
        "Gestion complète des réservations",
        "Entrées/Sorties",
        "Ménage & Maintenance",
        "Shooting professionnel",
        "Kit d'accueil basique"
      ],
      popular: true
    },
    {
      name: "Forfait Prémium",
      subtitle: "Pour une gestion exigeante et des services à la carte",
      commission: "FFT",
      description: "Pour les propriétaires ayant des propriétés particulières ou souhaitant une gestion ultra-personnalisée.",
      features: [
        "Tous les services Optimisée",
        "Kit d'accueil prémium",
        "Stratégie marketing personnalisée",
        "Storytelling sur-mesure",
        "Conseils stratégiques"
      ],
      popular: false
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold font-heading text-primary mb-4">
            Nos Services
          </h2>
          <p className="text-xl text-secondary max-w-3xl mx-auto">
            L'expertise Nzoo Immo fait la différence. On s'occupe de tout pour maximiser vos revenus 
            et garantir une expérience exceptionnelle à vos voyageurs.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 group border border-light-gray"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <service.icon className="w-6 h-6 text-white" />
                </div>
                <span className="ml-3 px-3 py-1 bg-light-gray text-primary text-xs font-medium rounded-full">
                  {service.category}
                </span>
              </div>
              <h3 className="text-xl font-semibold font-heading text-primary mb-3">
                {service.title}
              </h3>
              <p className="text-secondary leading-relaxed">
                {service.description}
              </p>
            </div>
          ))}
        </div>

        {/* Forfaits */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold font-heading text-primary mb-4">
              Nos Forfaits Conciergerie
            </h2>
            <p className="text-xl text-secondary">
              Trouvez la formule qui vous correspond
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {packages.map((pkg, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-3xl p-8 shadow-xl transition-all duration-300 hover:scale-105 ${
                  pkg.popular 
                    ? 'ring-2 ring-primary bg-gradient-to-b from-blue-50 to-white' 
                    : 'border border-light-gray'
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-white px-6 py-2 rounded-full text-sm font-semibold flex items-center space-x-1">
                      <Star className="w-4 h-4" />
                      <span>Populaire</span>
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold font-heading text-primary mb-2">
                    {pkg.name}
                  </h3>
                  <p className="text-secondary text-sm mb-4">
                    {pkg.subtitle}
                  </p>
                  <div className="flex items-baseline justify-center space-x-1">
                    <span className="text-4xl font-bold text-primary">
                      {pkg.commission}
                    </span>
                    {pkg.commission !== 'FFT' && (
                      <span className="text-secondary text-lg">commission</span>
                    )}
                  </div>
                </div>

                <p className="text-secondary text-center mb-6 text-sm leading-relaxed">
                  {pkg.description}
                </p>

                <ul className="space-y-3 mb-8">
                  {pkg.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                      <span className="text-secondary">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
                  pkg.popular
                    ? 'bg-primary text-white hover:bg-primary-light shadow-lg'
                    : 'bg-light-gray text-secondary hover:bg-gray-200'
                }`}>
                  Choisir ce forfait
                </button>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <p className="text-gray-500 text-sm">
              * FFT : Forfait à la carte négociable selon vos besoins spécifiques
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-primary via-primary-light to-secondary rounded-3xl p-12 text-center">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-3xl font-bold font-heading text-white mb-4">
              Prêt à transformer votre bien en source de revenus exceptionnelle ?
            </h3>
            <p className="text-gray-200 text-lg mb-8">
              Contactez-nous dès aujourd'hui pour une consultation gratuite et sans engagement.
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
    </section>
  );
};

export default ServicesSection;