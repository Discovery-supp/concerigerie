import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Star, Clock, Calendar, DollarSign, Phone, Mail, Building2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { serviceProvidersService } from '../services/serviceProviders';

interface ServiceProvider {
  id: string;
  user_id: string;
  company: string | null;
  experience: string;
  services: string[];
  availability: Record<string, any>;
  hourly_rate: number;
  intervention_zones: string[];
  rating: number;
  completed_jobs: number;
  users?: {
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
  };
}

const ServiceProvidersSearchPage: React.FC = () => {
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [minRating, setMinRating] = useState<number>(0);
  const [availableServices, setAvailableServices] = useState<string[]>([]);
  const [availableZones, setAvailableZones] = useState<string[]>([]);

  useEffect(() => {
    loadProviders();
  }, []);

  useEffect(() => {
    filterProviders();
  }, [providers, searchTerm, selectedService, selectedZone, selectedDate, selectedTime, minRating]);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const data = await serviceProvidersService.getVerifiedProviders();
      setProviders(data || []);

      // Extraire les services et zones uniques
      const servicesSet = new Set<string>();
      const zonesSet = new Set<string>();
      
      (data || []).forEach((provider: ServiceProvider) => {
        if (provider.services && Array.isArray(provider.services)) {
          provider.services.forEach((service: string) => servicesSet.add(service));
        }
        if (provider.intervention_zones && Array.isArray(provider.intervention_zones)) {
          provider.intervention_zones.forEach((zone: string) => zonesSet.add(zone));
        }
      });

      setAvailableServices(Array.from(servicesSet));
      setAvailableZones(Array.from(zonesSet));
      setFilteredProviders(data || []);
    } catch (error) {
      console.error('Erreur chargement prestataires:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProviders = () => {
    let filtered = [...providers];

    // Filtre par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(provider => {
        const searchLower = searchTerm.toLowerCase();
        return (
          provider.company?.toLowerCase().includes(searchLower) ||
          provider.users?.first_name?.toLowerCase().includes(searchLower) ||
          provider.users?.last_name?.toLowerCase().includes(searchLower) ||
          provider.experience?.toLowerCase().includes(searchLower) ||
          provider.services?.some((s: string) => s.toLowerCase().includes(searchLower))
        );
      });
    }

    // Filtre par service
    if (selectedService) {
      filtered = filtered.filter(provider =>
        provider.services?.includes(selectedService)
      );
    }

    // Filtre par zone
    if (selectedZone) {
      filtered = filtered.filter(provider =>
        provider.intervention_zones?.includes(selectedZone)
      );
    }

    // Filtre par date (vérifier la disponibilité)
    if (selectedDate) {
      filtered = filtered.filter(provider => {
        if (!provider.availability || typeof provider.availability !== 'object') return true;
        // Logique de vérification de disponibilité par date
        // À adapter selon votre structure de données
        return true; // Pour l'instant, on accepte tous
      });
    }

    // Filtre par horaire
    if (selectedTime) {
      filtered = filtered.filter(provider => {
        // Logique de vérification de disponibilité par horaire
        // À adapter selon votre structure de données
        return true; // Pour l'instant, on accepte tous
      });
    }

    // Filtre par note minimale
    if (minRating > 0) {
      filtered = filtered.filter(provider => provider.rating >= minRating);
    }

    setFilteredProviders(filtered);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Recherche de Prestataires</h1>
        <p className="text-gray-600">Trouvez le prestataire idéal pour vos besoins</p>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {/* Recherche textuelle */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              Recherche
            </label>
            <input
              type="text"
              placeholder="Nom, entreprise, service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Service */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Service
            </label>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Tous les services</option>
              {availableServices.map(service => (
                <option key={service} value={service}>{service}</option>
              ))}
            </select>
          </div>

          {/* Zone d'intervention */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Zone
            </label>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Toutes les zones</option>
              {availableZones.map(zone => (
                <option key={zone} value={zone}>{zone}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Horaire */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Horaire
            </label>
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Tous les horaires</option>
              <option value="morning">Matin (8h-12h)</option>
              <option value="afternoon">Après-midi (12h-18h)</option>
              <option value="evening">Soirée (18h-22h)</option>
            </select>
          </div>

          {/* Note minimale */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Star className="w-4 h-4 inline mr-1" />
              Note minimale
            </label>
            <select
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="0">Toutes les notes</option>
              <option value="4">4 étoiles et plus</option>
              <option value="4.5">4.5 étoiles et plus</option>
              <option value="5">5 étoiles</option>
            </select>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          {filteredProviders.length} prestataire{filteredProviders.length > 1 ? 's' : ''} trouvé{filteredProviders.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* Liste des prestataires */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProviders.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">Aucun prestataire trouvé</p>
          </div>
        ) : (
          filteredProviders.map(provider => (
            <div key={provider.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {provider.company || `${provider.users?.first_name} ${provider.users?.last_name}`}
                  </h3>
                  {provider.company && (
                    <p className="text-sm text-gray-600">
                      {provider.users?.first_name} {provider.users?.last_name}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium text-gray-900">
                    {provider.rating.toFixed(1)}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">{provider.experience}</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {provider.services?.slice(0, 3).map((service: string, index: number) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {service}
                    </span>
                  ))}
                  {provider.services && provider.services.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{provider.services.length - 3}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {provider.intervention_zones && provider.intervention_zones.length > 0 && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{provider.intervention_zones.join(', ')}</span>
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-600">
                  <DollarSign className="w-4 h-4 mr-1" />
                  <span>{provider.hourly_rate.toFixed(2)} €/heure</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Building2 className="w-4 h-4 mr-1" />
                  <span>{provider.completed_jobs} mission{provider.completed_jobs > 1 ? 's' : ''} complétée{provider.completed_jobs > 1 ? 's' : ''}</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    {provider.users?.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-1" />
                        <span>{provider.users.phone}</span>
                      </div>
                    )}
                    {provider.users?.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-4 h-4 mr-1" />
                        <span className="truncate">{provider.users.email}</span>
                      </div>
                    )}
                  </div>
                  <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors text-sm font-medium">
                    Contacter
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ServiceProvidersSearchPage;

