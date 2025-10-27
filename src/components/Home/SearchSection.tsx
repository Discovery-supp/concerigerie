import React from 'react';
import { Search, Calendar, Users, MapPin } from 'lucide-react';

const SearchSection: React.FC = () => {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Barre de recherche/réservation */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-5xl mx-auto border border-light-gray">
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
                  className="w-full pl-10 pr-4 py-3 border border-light-gray rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Voyageurs */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-secondary mb-2">Voyageurs</label>
              <div className="relative">
                <Users className="absolute left-3 top-3 w-5 h-5 text-secondary" />
                <select className="w-full pl-10 pr-4 py-3 border border-light-gray rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent appearance-none">
                  <option>1 voyageur</option>
                  <option>2 voyageurs</option>
                  <option>3 voyageurs</option>
                  <option>4+ voyageurs</option>
                </select>
              </div>
            </div>
          </div>

          <button className="w-full md:w-auto mt-6 px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-light transition-all shadow-lg flex items-center justify-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Rechercher</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default SearchSection;