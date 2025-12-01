import React, { useState } from 'react';
import { Search, Filter, MapPin, Star, Users, Bed, Bath, Wifi, Car, School as Pool, ChevronDown, ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useEffect } from 'react';
import propertiesService from '../services/properties';
import reviewsService from '../services/reviews';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import OptimizedImage from '../components/Common/OptimizedImage';

const PropertiesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('all');
  const [beachAccess, setBeachAccess] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isFromDashboard, setIsFromDashboard] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Vérifier si l'utilisateur vient du dashboard et s'il est connecté
  useEffect(() => {
    const fromDashboard = searchParams.get('from') === 'dashboard';
    setIsFromDashboard(fromDashboard);
    
    // Vérifier si l'utilisateur est connecté
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    checkAuth();
  }, [searchParams]);

  // Lire les paramètres de recherche depuis l'URL au chargement
  useEffect(() => {
    const destination = searchParams.get('destination');
    const arrival = searchParams.get('arrival');
    const departure = searchParams.get('departure');
    const travelers = searchParams.get('travelers');

    if (destination) {
      setSearchTerm(destination);
    }
    
    // Vous pouvez utiliser arrival, departure et travelers pour filtrer les propriétés
    // Par exemple, filtrer par disponibilité ou capacité
    if (travelers) {
      const numTravelers = parseInt(travelers);
      // Filtrer les propriétés qui peuvent accueillir ce nombre de voyageurs
      // Cela sera fait dans le filtrage des propriétés
    }
  }, [searchParams]);

  // Charger les propriétés depuis la base de données (une seule fois au chargement)
  useEffect(() => {
    loadProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProperties = async () => {
    try {
      setLoading(true);
      
      // Ne pas appeler Supabase si non configuré
      if (!isSupabaseConfigured) {
        setProperties([]);
        setLoading(false);
        return;
      }
      
      // Charger toutes les propriétés publiées (le filtrage se fera côté client)
      const data = await propertiesService.getProperties();
      
      // Enrichir avec les notes et avis + offres spéciales
      const enrichedProperties = await Promise.all(
        data.map(async (property) => {
          const { average, count } = await reviewsService.getPropertyAverageRating(property.id);

          // Charger les offres spéciales actives pour cette propriété
          // On montre une offre si elle est active aujourd'hui ou dans les 60 prochains jours
          let activeSpecialOffer: any = null;
          try {
            const today = new Date().toISOString().split('T')[0];
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 60);
            const futureDateStr = futureDate.toISOString().split('T')[0];
            
            const { data: offers } = await supabase
              .from('special_offers')
              .select('start_date, end_date, special_price_per_night, title')
              .eq('property_id', property.id)
              .eq('is_active', true)
              .lte('start_date', futureDateStr)
              .gte('end_date', today)
              .order('start_date', { ascending: true })
              .limit(1)
              .maybeSingle();
            
            if (offers) {
              activeSpecialOffer = {
                ...offers,
                special_price_per_night: Number(offers.special_price_per_night) || 0,
              };
            }
          } catch (err) {
            console.warn('Erreur chargement offre spéciale pour propriété', property.id, err);
          }

          // Gérer les images - les images peuvent être un tableau JSONB ou un tableau simple
          let imageUrl = 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg';
          
          // Normaliser le format des images (peut être jsonb ou array)
          let imagesArray: string[] = [];
          if (property.images) {
            if (Array.isArray(property.images)) {
              imagesArray = property.images;
            } else if (typeof property.images === 'string') {
              // Si c'est une string, essayer de la parser comme JSON
              try {
                const parsed = JSON.parse(property.images);
                imagesArray = Array.isArray(parsed) ? parsed : [];
              } catch {
                imagesArray = [property.images];
              }
            } else if (property.images && typeof property.images === 'object') {
              // Si c'est un objet JSONB, essayer de l'extraire
              imagesArray = Object.values(property.images) as string[];
            }
          }
          
          if (imagesArray && imagesArray.length > 0) {
            const firstImage = imagesArray[0];
            // Vérifier si c'est une URL base64
            if (firstImage.startsWith('data:image')) {
              imageUrl = firstImage;
            } else if (firstImage.startsWith('http://') || firstImage.startsWith('https://')) {
              // URL complète
              imageUrl = firstImage;
            } else if (firstImage.startsWith('/')) {
              // Chemin local
              imageUrl = firstImage;
            } else {
              // Autre format, essayer avec https://
              imageUrl = firstImage;
            }
          }
          
          // Log pour déboguer
          if (imagesArray.length === 0 && property.id) {
            console.warn(`Propriété ${property.id} n'a pas d'images:`, property.images);
          }

          return {
            ...property,
            rating: average,
            reviewsCount: count,
            image: imageUrl,
            activeSpecialOffer
          };
        })
      );
      
      setProperties(enrichedProperties);
    } catch (error) {
      // Ne logger l'erreur que si Supabase est configuré
      if (isSupabaseConfigured) {
        console.error('Erreur détaillée:', error);
        console.error('Erreur chargement propriétés:', error);
      }
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const propertyTypes = [
    { value: 'all', label: 'Tous les types' },
    { value: 'apartment', label: 'Appartement' },
    { value: 'house', label: 'Maison' },
    { value: 'villa', label: 'Villa' },
    { value: 'studio', label: 'Studio' },
    { value: 'room', label: 'Chambre' }
  ];

  const categories = [
    { value: 'all', label: 'Toutes catégories' },
    { value: 'Économique', label: 'Économique' },
    { value: 'Standard', label: 'Standard' },
    { value: 'Confort', label: 'Confort' },
    { value: 'Luxe', label: 'Luxe' },
    { value: 'Premium', label: 'Premium' }
  ];

  const neighborhoods = [
    { value: 'all', label: 'Tous les quartiers' },
    { value: 'Gombe', label: 'Gombe' },
    { value: 'Ngaliema', label: 'Ngaliema' },
    { value: 'Kinshasa Centre', label: 'Kinshasa Centre' },
    { value: 'Lemba', label: 'Lemba' },
    { value: 'Bandalungwa', label: 'Bandalungwa' }
  ];

  const availableAmenities = [
    { value: 'wifi', label: 'Wi-Fi' },
    { value: 'parking', label: 'Parking' },
    { value: 'pool', label: 'Piscine' },
    { value: 'kitchen', label: 'Cuisine' },
    { value: 'tv', label: 'Télévision' },
    { value: 'ac', label: 'Climatisation' }
  ];

  const amenityIcons = {
    wifi: Wifi,
    parking: Car,
    pool: Pool
  };

  // Récupérer les paramètres de recherche depuis l'URL
  const urlDestination = searchParams.get('destination') || '';
  const urlTravelers = searchParams.get('travelers');
  const urlArrival = searchParams.get('arrival');
  const urlDeparture = searchParams.get('departure');

  const filteredProperties = properties.filter(property => {
    // Recherche par destination (titre, adresse, quartier)
    const searchDestination = urlDestination || searchTerm;
    const matchesSearch = !searchDestination || 
      property.title?.toLowerCase().includes(searchDestination.toLowerCase()) ||
      property.address?.toLowerCase().includes(searchDestination.toLowerCase()) ||
      property.neighborhood?.toLowerCase().includes(searchDestination.toLowerCase()) ||
      property.location?.toLowerCase().includes(searchDestination.toLowerCase());
    
    // Filtrer par nombre de voyageurs (capacité maximale)
    const numTravelers = urlTravelers ? parseInt(urlTravelers) : null;
    const matchesCapacity = !numTravelers || (property.max_guests && property.max_guests >= numTravelers);
    
    const matchesType = selectedType === 'all' || property.type === selectedType;
    const matchesCategory = selectedCategory === 'all' || property.category === selectedCategory;
    const matchesNeighborhood = selectedNeighborhood === 'all' || property.neighborhood === selectedNeighborhood;
    const matchesBeachAccess = !beachAccess || property.beachAccess;
    const matchesRating = (property.rating || 0) >= minRating;
    const matchesPrice = property.price_per_night >= priceRange[0] && property.price_per_night <= priceRange[1];
    const matchesAmenities = selectedAmenities.length === 0 || 
      (property.amenities && Array.isArray(property.amenities) &&
      selectedAmenities.every(amenity => property.amenities.includes(amenity)));
    
    // Note: La vérification de disponibilité par dates nécessiterait une requête supplémentaire
    // pour vérifier les réservations existantes. Pour l'instant, on filtre juste par capacité.
    
    return matchesSearch && matchesCapacity && matchesType && matchesCategory && matchesNeighborhood && 
           matchesBeachAccess && matchesRating && matchesPrice && matchesAmenities;
  });

  const handleAmenityToggle = (amenity: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity) 
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };


  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Bouton retour au tableau de bord si on vient du dashboard */}
        {(isFromDashboard && isAuthenticated) && (
          <div className="mb-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-primary hover:text-primary-light transition-colors font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Retour au tableau de bord</span>
            </button>
          </div>
        )}

        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold font-heading text-primary mb-4">
            Nos Propriétés Disponibles
          </h1>
          <p className="text-xl text-secondary">
            Découvrez nos hébergements exceptionnels à Kinshasa
          </p>
        </div>

        {/* Barre de recherche et filtres */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Recherche */}
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-5 h-5 text-secondary" />
                <input
                  type="text"
                  placeholder="Rechercher par titre ou localisation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      // Mettre à jour l'URL avec le nouveau terme de recherche
                      const newParams = new URLSearchParams(searchParams);
                      if (searchTerm.trim()) {
                        newParams.set('destination', searchTerm.trim());
                      } else {
                        newParams.delete('destination');
                      }
                      setSearchParams(newParams);
                    }
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-light-gray rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  // Mettre à jour l'URL avec le nouveau terme de recherche
                  const newParams = new URLSearchParams(searchParams);
                  if (searchTerm.trim()) {
                    newParams.set('destination', searchTerm.trim());
                  } else {
                    newParams.delete('destination');
                  }
                  setSearchParams(newParams);
                }}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors flex items-center space-x-2 whitespace-nowrap"
              >
                <Search className="w-5 h-5" />
                <span>Rechercher</span>
              </button>
            </div>

            {/* Type de propriété */}
            <div className="lg:w-64">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-4 py-3 border border-light-gray rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {propertyTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Catégorie */}
            <div className="lg:w-64">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 border border-light-gray rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Bouton filtres */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors flex items-center space-x-2"
            >
              <Filter className="w-5 h-5" />
              <span>Filtres</span>
            </button>
          </div>

          {/* Filtres avancés */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-light-gray">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Fourchette de prix */}
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    Prix par nuit (USD)
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="number"
                      placeholder="Min"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                      className="w-full px-3 py-2 border border-light-gray rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <span className="text-secondary">-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 500])}
                      className="w-full px-3 py-2 border border-light-gray rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Quartier */}
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Quartier</label>
                  <select
                    value={selectedNeighborhood}
                    onChange={(e) => setSelectedNeighborhood(e.target.value)}
                    className="w-full px-3 py-2 border border-light-gray rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    {neighborhoods.map(neighborhood => (
                      <option key={neighborhood.value} value={neighborhood.value}>
                        {neighborhood.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Note minimum */}
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Note minimum</label>
                  <select
                    value={minRating}
                    onChange={(e) => setMinRating(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-light-gray rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value={0}>Toutes les notes</option>
                    <option value={3}>3+ étoiles</option>
                    <option value={4}>4+ étoiles</option>
                    <option value={4.5}>4.5+ étoiles</option>
                  </select>
                </div>

                {/* Accès plage */}
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Options</label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={beachAccess}
                      onChange={(e) => setBeachAccess(e.target.checked)}
                      className="mr-2 text-primary rounded" 
                    />
                    <span className="text-sm text-secondary">Accès à la plage</span>
                  </label>
                </div>
              </div>

              {/* Équipements */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-secondary mb-3">Équipements</label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {availableAmenities.map(amenity => (
                    <label key={amenity.value} className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={selectedAmenities.includes(amenity.value)}
                        onChange={() => handleAmenityToggle(amenity.value)}
                        className="mr-2 text-primary rounded" 
                      />
                      <span className="text-sm text-secondary">{amenity.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Résultats */}
        <div className="mb-6">
          <p className="text-secondary">
            {loading ? 'Chargement...' : `${filteredProperties.length} propriété${filteredProperties.length > 1 ? 's' : ''} trouvée${filteredProperties.length > 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Grille des propriétés */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
                <div className="h-64 bg-gray-300"></div>
                <div className="p-6 space-y-4">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-300 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProperties.map((property) => {
              const propertyUrl = isFromDashboard 
                ? `/property/${property.id}?from=dashboard`
                : `/property/${property.id}`;
              
              return (
              <Link
                key={property.id}
                to={propertyUrl}
                className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
              >
                {/* Image */}
                <div className="relative h-64 overflow-hidden bg-gray-200">
                  <OptimizedImage
                    src={property.image || 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg'}
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                  {/* Rating badge */}
                  <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full shadow-lg">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-semibold text-gray-900">
                        {property.rating ? property.rating.toFixed(1) : '0.0'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Badge Offre spéciale - très visible en haut à gauche */}
                  {property.activeSpecialOffer && (
                    <div className="absolute top-4 left-4 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg font-bold shadow-xl animate-pulse z-10">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">🌟</span>
                        <span className="text-sm font-bold">OFFRE SPÉCIALE</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Price badge */}
                  <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-1">
                    {property.activeSpecialOffer ? (
                      <>
                        <div className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg text-center">
                          <div className="text-xs line-through opacity-75 mb-0.5">
                            ${property.price_per_night}/nuit
                          </div>
                          <div className="text-lg">
                            ${property.activeSpecialOffer.special_price_per_night}/nuit
                          </div>
                          <div className="text-xs font-normal mt-0.5">
                            Économisez {Math.round((1 - property.activeSpecialOffer.special_price_per_night / property.price_per_night) * 100)}%
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg text-center">
                        ${property.price_per_night}/nuit
                      </div>
                    )}
                  </div>
                </div>

                {/* Contenu */}
                <div className="p-6">
                  {/* Titre */}
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {property.title}
                    </h3>
                  </div>

                  {/* Localisation */}
                  <div className="flex items-center text-gray-600 mb-4">
                    <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="text-sm line-clamp-1">{property.neighborhood || property.address || property.location || 'Kinshasa'}</span>
                  </div>

                  {/* Description */}
                  {property.description && (
                    <p className="text-gray-600 mb-4 line-clamp-2 text-sm leading-relaxed">
                      {property.description}
                    </p>
                  )}

                  {/* Détails (guests, bedrooms, bathrooms) */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        <span>{property.max_guests || 0}</span>
                      </div>
                      <div className="flex items-center">
                        <Bed className="w-4 h-4 mr-1" />
                        <span>{property.bedrooms || 0}</span>
                      </div>
                      <div className="flex items-center">
                        <Bath className="w-4 h-4 mr-1" />
                        <span>{property.bathrooms || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Avis count */}
                  {property.reviewsCount > 0 && (
                    <div className="mt-3 text-sm text-gray-500">
                      ({property.reviewsCount} avis)
                    </div>
                  )}
                </div>
              </Link>
              );
            })}
          </div>
        )}

        {/* Message si aucun résultat */}
        {!loading && filteredProperties.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏠</div>
            <h3 className="text-xl font-semibold font-heading text-primary mb-2">
              Aucune propriété trouvée
            </h3>
            <p className="text-secondary">
              Essayez de modifier vos critères de recherche
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertiesPage;