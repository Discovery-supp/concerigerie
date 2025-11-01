import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, MapPin, Users, Bed, Bath, Wifi, Car, School as Pool, ChevronLeft, ChevronRight, Calendar, CreditCard, ArrowLeft } from 'lucide-react';
import OptimizedImage from '../components/Common/OptimizedImage';
import propertiesService from '../services/properties';
import RealTimeBooking from '../components/Booking/RealTimeBooking';
import { supabase } from '../lib/supabase';

const PropertyDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      loadProperty();
    }
  }, [id]);

  const loadProperty = async () => {
    try {
      setLoading(true);
      
      if (!id) {
        console.error('ID de propriété manquant');
        throw new Error('ID de propriété manquant');
      }
      
      console.log('Chargement propriété avec ID:', id);
      const data = await propertiesService.getPropertyById(id);
      
      // Normaliser les images
      let imagesArray: string[] = [];
      if (data.images) {
        if (Array.isArray(data.images)) {
          imagesArray = data.images;
        } else if (typeof data.images === 'string') {
          try {
            const parsed = JSON.parse(data.images);
            imagesArray = Array.isArray(parsed) ? parsed : [data.images];
          } catch {
            imagesArray = [data.images];
          }
        } else if (typeof data.images === 'object') {
          imagesArray = Object.values(data.images) as string[];
        }
      }
      
      // Si pas d'images, utiliser une image par défaut
      if (imagesArray.length === 0) {
        imagesArray = ['https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg'];
      }

      // Charger les avis
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*, reviewer:user_profiles!reviews_reviewer_id_fkey(first_name, last_name)')
        .eq('property_id', id)
        .order('created_at', { ascending: false });

      setProperty({
        ...data,
        images: imagesArray,
        price: Number(data.price_per_night) || 0,
        cleaningFee: Number(data.cleaning_fee) || 0,
        serviceFee: 0.12,
        guests: data.max_guests || 1,
        bedrooms: data.bedrooms || 0,
        bathrooms: data.bathrooms || 1,
        beds: data.beds || 1,
        surface: data.surface || 0,
        location: data.address || '',
        checkIn: data.check_in_time || '14:00',
        checkOut: data.check_out_time || '11:00',
        rules: Array.isArray(data.rules) ? data.rules : (data.rules ? [data.rules] : []),
        amenities: Array.isArray(data.amenities) ? data.amenities : []
      });
      
      setReviews(reviewsData || []);
    } catch (error: any) {
      console.error('Erreur chargement propriété:', error);
      console.error('Erreur détaillée:', {
        message: error.message,
        code: error.code,
        details: error,
        id: id
      });
      
      // Afficher un message plus détaillé
      const errorMessage = error.message || 'Erreur inconnue';
      alert(`Erreur lors du chargement de la propriété:\n\n${errorMessage}\n\nVérifiez la console pour plus de détails.`);
      
      navigate('/properties');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de la propriété...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Propriété non trouvée</p>
          <button
            onClick={() => navigate('/properties')}
            className="px-4 py-2 bg-primary text-white rounded-lg"
          >
            Retour aux propriétés
          </button>
        </div>
      </div>
    );
  }

  const amenityIcons = {
    wifi: { icon: Wifi, label: 'Wi-Fi' },
    parking: { icon: Car, label: 'Parking' },
    pool: { icon: Pool, label: 'Piscine' },
    kitchen: { icon: Users, label: 'Cuisine' },
    tv: { icon: Users, label: 'Télévision' },
    ac: { icon: Users, label: 'Climatisation' }
  };

  const nextImage = () => {
    const imagesLength = normalizedImages.length || 1;
    setCurrentImageIndex((prev) => (prev + 1) % imagesLength);
  };

  const prevImage = () => {
    const imagesLength = normalizedImages.length || 1;
    setCurrentImageIndex((prev) => (prev - 1 + imagesLength) % imagesLength);
  };

  const calculateTotal = (nights: number) => {
    const subtotal = nights * property.price;
    const cleaning = property.cleaningFee;
    const serviceFee = (subtotal + cleaning) * property.serviceFee;
    return subtotal + cleaning + serviceFee;
  };

  const normalizedImages = Array.isArray(property.images) ? property.images : [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Bouton retour */}
        <button
          onClick={() => navigate('/properties')}
          className="mb-4 flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Retour aux propriétés</span>
        </button>

        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-heading text-primary mb-2">
            {property.title}
          </h1>
          <div className="flex items-center space-x-4 text-secondary">
            <div className="flex items-center">
              <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
              <span className="font-medium">{property.rating || 0}</span>
              <span className="ml-1">({reviews.length} avis)</span>
            </div>
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{property.location}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contenu principal */}
          <div className="lg:col-span-2 space-y-8">
            {/* Galerie d'images */}
            <div className="relative">
              <div className="aspect-video bg-gray-200 rounded-2xl overflow-hidden">
                <OptimizedImage
                  src={normalizedImages[currentImageIndex] || normalizedImages[0] || 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg'}
                  alt={`Image ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg';
                  }}
                />
                
                {/* Contrôles de navigation */}
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white bg-opacity-80 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white bg-opacity-80 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Indicateurs */}
                {normalizedImages.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {normalizedImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                        }`}
                      />
                    ))}
                  </div>
                )}

                {/* Compteur d'images */}
                {normalizedImages.length > 1 && (
                  <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                    {currentImageIndex + 1} / {normalizedImages.length}
                  </div>
                )}
              </div>

              {/* Miniatures */}
              {normalizedImages.length > 1 && (
                <div className="grid grid-cols-5 gap-2 mt-4">
                  {normalizedImages.slice(0, 5).map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                        index === currentImageIndex ? 'border-primary' : 'border-transparent'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`Miniature ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg';
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Informations sur l'hôte */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-primary">
                    Hébergement proposé par l'hôte
                  </h3>
                  <div className="flex items-center space-x-4 text-secondary text-sm">
                    <span>{property.guests} voyageurs</span>
                    <span>{property.bedrooms} chambres</span>
                    <span>{property.beds} lits</span>
                    <span>{property.bathrooms} salles de bain</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold font-heading text-primary mb-4">
                À propos de ce logement
              </h3>
              <p className="text-secondary leading-relaxed">
                {property.description}
              </p>
            </div>

            {/* Équipements */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold font-heading text-primary mb-4">
                Équipements proposés
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {property.amenities.map((amenity, index) => {
                  const amenityInfo = amenityIcons[amenity as keyof typeof amenityIcons];
                  return amenityInfo ? (
                    <div key={index} className="flex items-center space-x-3">
                      <amenityInfo.icon className="w-5 h-5 text-primary" />
                      <span className="text-secondary">{amenityInfo.label}</span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>

            {/* Règles de la maison */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold font-heading text-primary mb-4">
                Règles de la maison
              </h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span className="text-secondary">Arrivée : après {property.checkIn}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span className="text-secondary">Départ : avant {property.checkOut}</span>
                </div>
                {property.rules.map((rule, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="text-secondary">{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar de réservation */}
          <div className="lg:col-span-1">
            <RealTimeBooking
              property={{
                id: property.id,
                title: property.title,
                price_per_night: Number(property.price_per_night) || property.price || 0,
                cleaning_fee: Number(property.cleaning_fee) || property.cleaningFee || 0,
                max_guests: property.guests || property.max_guests || 1,
                min_nights: property.min_nights || 1,
                max_nights: property.max_nights || 365,
                cancellation_policy: property.cancellation_policy || 'flexible',
                long_stay_discount_7: property.long_stay_discount_7,
                long_stay_discount_30: property.long_stay_discount_30
              }}
              onBookingSuccess={(reservationId) => {
                alert('Réservation confirmée !');
                navigate(`/confirmation?reservation=${reservationId}`);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailPage;