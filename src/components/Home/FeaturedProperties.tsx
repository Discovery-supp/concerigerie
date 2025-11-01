import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users, Bed, Bath, Star } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

interface Property {
  id: string;
  title: string;
  description: string;
  price_per_night: string;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  address: string;
  neighborhood: string;
  images: string[];
}

const FeaturedProperties: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProperties();
  }, []);

  const fetchFeaturedProperties = async () => {
    try {
      // Ne pas appeler Supabase si non configuré
      if (!isSupabaseConfigured) {
        setProperties([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('properties')
        .select('id, title, description, price_per_night, bedrooms, bathrooms, max_guests, address, neighborhood, images')
        .eq('is_published', true)
        .limit(6);

      if (error) throw error;
      console.log('Properties loaded:', data);
      setProperties(data || []);
    } catch (error) {
      // Ne logger l'erreur que si Supabase est configuré
      if (isSupabaseConfigured) {
        console.error('Erreur lors du chargement des propriétés:', error);
      }
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-pulse">Chargement...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Propriétés les plus populaires
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Découvrez nos hébergements les plus réservés et appréciés par nos voyageurs
          </p>
        </div>

        {properties.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg mb-4">
              {isSupabaseConfigured 
                ? 'Aucune propriété disponible pour le moment.' 
                : 'Configurez Supabase pour afficher les propriétés.'}
            </p>
            <Link
              to="/properties"
              className="inline-block px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-light transition-all"
            >
              Voir toutes les propriétés
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map((property) => (
            <Link
              key={property.id}
              to={`/property/${property.id}`}
              className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
            >
              <div className="relative h-64 overflow-hidden bg-gray-200">
                <img
                  src={
                    (() => {
                      if (!property.images || property.images.length === 0) {
                        return 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg';
                      }
                      const img = Array.isArray(property.images) ? property.images[0] : property.images;
                      if (typeof img === 'string') {
                        // Si c'est base64 ou URL complète, utiliser directement
                        if (img.startsWith('data:') || img.startsWith('http')) {
                          return img;
                        }
                        // Sinon, essayer de parser si c'est JSON
                        try {
                          const parsed = JSON.parse(img);
                          return Array.isArray(parsed) ? parsed[0] : img;
                        } catch {
                          return img;
                        }
                      }
                      return 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg';
                    })()
                  }
                  alt={property.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg';
                  }}
                />
                <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full shadow-lg">
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-semibold text-gray-900">4.8</span>
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg">
                  ${property.price_per_night}/nuit
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                    {property.title}
                  </h3>
                </div>

                <div className="flex items-center text-gray-600 mb-4">
                  <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="text-sm line-clamp-1">{property.neighborhood}</span>
                </div>

                <p className="text-gray-600 mb-4 line-clamp-2 text-sm leading-relaxed">
                  {property.description}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      <span>{property.max_guests}</span>
                    </div>
                    <div className="flex items-center">
                      <Bed className="w-4 h-4 mr-1" />
                      <span>{property.bedrooms}</span>
                    </div>
                    <div className="flex items-center">
                      <Bath className="w-4 h-4 mr-1" />
                      <span>{property.bathrooms}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
          </div>
        )}

        {properties.length > 0 && (
          <div className="text-center mt-12">
          <Link
            to="/properties"
            className="inline-block px-8 py-4 bg-[#183154] text-white font-semibold rounded-lg hover:bg-[#1a3a5f] transition-all shadow-lg hover:shadow-xl"
          >
            Voir tous les hébergements
          </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeaturedProperties;
