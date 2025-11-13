import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, Users, MapPin } from 'lucide-react';

const SearchSection: React.FC = () => {
  const navigate = useNavigate();
  const [destination, setDestination] = useState('kinshasa,gombe');
  const [arrivalDate, setArrivalDate] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [travelers, setTravelers] = useState('1');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construire les paramètres de recherche
    const searchParams = new URLSearchParams();
    
    if (destination && destination.trim()) {
      searchParams.set('destination', destination.trim());
    }
    
    if (arrivalDate) {
      searchParams.set('arrival', arrivalDate);
    }
    
    if (departureDate) {
      searchParams.set('departure', departureDate);
    }
    
    if (travelers) {
      searchParams.set('travelers', travelers);
    }
    
    // Rediriger vers la page des propriétés avec les paramètres de recherche
    navigate(`/properties?${searchParams.toString()}`);
  };

  // Définir la date minimale comme aujourd'hui
  const today = new Date().toISOString().split('T')[0];
  
  // Définir la date minimale pour le départ comme la date d'arrivée (si sélectionnée)
  const minDepartureDate = arrivalDate || today;

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Barre de recherche/réservation */}
        <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-5xl mx-auto border border-light-gray">
          <h3 className="text-2xl font-bold font-heading text-primary mb-6 text-center">
            Trouvez votre hébergement parfait
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-2">
            {/* Destination */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-secondary mb-2">Destination</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-secondary" />
                <input
                  type="text"
                  placeholder="Kinshasa, RDC"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-light-gray rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Check-in */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-secondary mb-2">Arrivée</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-5 h-5 text-secondary" />
                <input
                  type="date"
                  value={arrivalDate}
                  onChange={(e) => {
                    setArrivalDate(e.target.value);
                    // Si la date de départ est antérieure à la nouvelle date d'arrivée, la réinitialiser
                    if (departureDate && e.target.value && departureDate < e.target.value) {
                      setDepartureDate('');
                    }
                  }}
                  min={today}
                  className="w-full pl-10 pr-4 py-3 border border-light-gray rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Check-out */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-secondary mb-2">Départ</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-5 h-5 text-secondary" />
                <input
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  min={minDepartureDate}
                  className="w-full pl-10 pr-4 py-3 border border-light-gray rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Voyageurs */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-secondary mb-2">Voyageurs</label>
              <div className="relative">
                <Users className="absolute left-3 top-3 w-5 h-5 text-secondary" />
                <select 
                  value={travelers}
                  onChange={(e) => setTravelers(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-light-gray rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent appearance-none"
                >
                  <option value="1">1 voyageur</option>
                  <option value="2">2 voyageurs</option>
                  <option value="3">3 voyageurs</option>
                  <option value="4">4 voyageurs</option>
                  <option value="5">5 voyageurs</option>
                  <option value="6">6+ voyageurs</option>
                </select>
              </div>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full md:w-auto mt-6 px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-light transition-all shadow-lg flex items-center justify-center space-x-2"
          >
            <Search className="w-5 h-5" />
            <span>Rechercher</span>
          </button>
        </form>
      </div>
    </section>
  );
};

export default SearchSection;