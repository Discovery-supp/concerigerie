import React from 'react';
import { Shield, Award, Clock, Users, Star, TrendingUp } from 'lucide-react';

const WhyChooseUs: React.FC = () => {
  const reasons = [
    {
      icon: Shield,
      title: "Sécurité Garantie",
      description: "Vérification rigoureuse de tous nos partenaires et propriétés pour votre tranquillité d'esprit."
    },
    {
      icon: Award,
      title: "Excellence Reconnue",
      description: "Plus de 95% de satisfaction client avec des standards de qualité exceptionnels."
    },
    {
      icon: Clock,
      title: "Support 24/7",
      description: "Une équipe dédiée disponible à tout moment pour répondre à vos besoins."
    },
    {
      icon: Users,
      title: "Expertise Locale",
      description: "Connaissance approfondie de Kinshasa pour des recommandations personnalisées."
    },
    {
      icon: TrendingUp,
      title: "Revenus Optimisés",
      description: "Stratégies de pricing dynamique pour maximiser vos revenus locatifs."
    },
    {
      icon: Star,
      title: "Service Premium",
      description: "Attention aux détails et service personnalisé pour une expérience unique."
    }
  ];

  const testimonials = [
    {
      name: "Marie Kabila",
      role: "Propriétaire",
      image: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg",
      rating: 5,
      comment: "Nzoo Immo a transformé ma propriété en une source de revenus stable. Leur professionnalisme est remarquable et je recommande vivement leurs services."
    },
    {
      name: "Jean-Pierre Mukendi",
      role: "Voyageur d'affaires",
      image: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg",
      rating: 5,
      comment: "Séjour exceptionnel ! L'accueil était chaleureux et l'appartement parfaitement équipé. Je reviendrai certainement lors de mon prochain voyage à Kinshasa."
    },
    {
      name: "Sarah Mbuyi",
      role: "Propriétaire",
      image: "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg",
      rating: 5,
      comment: "Depuis que j'ai confié ma propriété à Nzoo Immo, mes revenus ont augmenté de 40%. Leur équipe gère tout avec une efficacité impressionnante."
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Pourquoi nous choisir */}
        <div className="mb-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold font-heading text-primary mb-4">
              Pourquoi Nous Choisir ?
            </h2>
            <p className="text-xl text-secondary max-w-3xl mx-auto">
              L'Expertise Nzoo Immo Fait la Différence. On s'occupe de tout pour vous offrir la meilleure expérience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {reasons.map((reason, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 group border border-light-gray"
              >
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <reason.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold font-heading text-primary mb-4">
                  {reason.title}
                </h3>
                <p className="text-secondary leading-relaxed">
                  {reason.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Témoignages */}
        <div>
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold font-heading text-primary mb-4">
              Ce Que Disent Nos Clients
            </h2>
            <p className="text-xl text-secondary">
              Des témoignages authentiques de nos partenaires et voyageurs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-light-gray"
              >
                <div className="flex items-center mb-6">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h4 className="font-semibold text-primary">{testimonial.name}</h4>
                    <p className="text-secondary text-sm">{testimonial.role}</p>
                    <div className="flex text-yellow-400 mt-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-secondary leading-relaxed italic">
                  "{testimonial.comment}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;