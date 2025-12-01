import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Star, MapPin, Users, Bed, Bath, Wifi, Car, School as Pool, ChevronLeft, ChevronRight, Calendar, CreditCard, ArrowLeft, MessageCircle } from 'lucide-react';
import OptimizedImage from '../components/Common/OptimizedImage';
import propertiesService from '../services/properties';
import RealTimeBooking from '../components/Booking/RealTimeBooking';
import { supabase } from '../lib/supabase';

const PropertyDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [hostInfo, setHostInfo] = useState<any>(null);
  const [isFromDashboard, setIsFromDashboard] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Vérifier si on vient du dashboard
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

      // Charger les avis sans jointures (plus fiable)
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .eq('property_id', id)
        .order('created_at', { ascending: false });

      // Si erreur, continuer sans reviews
      if (reviewsError) {
        console.warn('Erreur chargement reviews:', reviewsError);
      }

      // Charger les infos des reviewers séparément si nécessaire
      let reviewsWithReviewers = reviewsData || [];
      if (reviewsWithReviewers.length > 0) {
        try {
          const reviewerIds = [...new Set(reviewsWithReviewers.map((r: any) => r.reviewer_id).filter(Boolean))];
          if (reviewerIds.length > 0) {
            const { data: reviewersData } = await supabase
              .from('user_profiles')
              .select('id, first_name, last_name')
              .in('id', reviewerIds);

            if (reviewersData) {
              const reviewersMap = new Map(reviewersData.map(r => [r.id, r]));
              reviewsWithReviewers = reviewsWithReviewers.map((review: any) => ({
                ...review,
                reviewer: reviewersMap.get(review.reviewer_id) || null
              }));
            }
          }
        } catch (reviewerError) {
          console.warn('Erreur chargement reviewers:', reviewerError);
        }
      }

      // Charger les informations de l'hôte (année d'inscription)
      if (data.owner_id) {
        try {
          const { data: hostData, error: hostError } = await supabase
          .from('user_profiles')
          .select('id, first_name, last_name, created_at')
          .eq('id', data.owner_id)
            .maybeSingle();
        
          if (hostError) {
            console.warn('Erreur chargement hôte:', hostError);
          } else if (hostData) {
          setHostInfo(hostData);
          }
        } catch (hostError) {
          console.warn('Erreur chargement informations hôte:', hostError);
        }
      }

      // Charger les légendes des images
      let imageCaptions: { url: string; caption: string }[] = [];
      if (data.image_captions) {
        try {
          const captions = typeof data.image_captions === 'string' 
            ? JSON.parse(data.image_captions)
            : data.image_captions;
          imageCaptions = Array.isArray(captions) ? captions : [];
        } catch {
          imageCaptions = [];
        }
      }

      setProperty({
        ...data,
        images: imagesArray,
        imageCaptions: imageCaptions,
        price: Number(data.price_per_night) || 0,
        cleaningFee: Number(data.cleaning_fee) || 0,
        serviceFee: 0.12,
        guests: data.max_guests || 1,
        bedrooms: data.bedrooms || 0,
        bathrooms: data.bathrooms || 1,
        beds: data.beds || 1,
        surface: data.surface || 0,
        location: data.address || '',
        commune: data.commune || '',
        latitude: data.latitude,
        longitude: data.longitude,
        checkIn: data.check_in_time || '14:00',
        checkOut: data.check_out_time || '11:00',
        rules: Array.isArray(data.rules) ? data.rules : (data.rules ? [data.rules] : []),
        amenities: Array.isArray(data.amenities) 
          ? data.amenities 
          : (typeof data.amenities === 'string' 
              ? (() => {
                  try {
                    const parsed = JSON.parse(data.amenities);
                    return Array.isArray(parsed) ? parsed : [];
                  } catch {
                    return data.amenities ? [data.amenities] : [];
                  }
                })()
              : [])
      });
      
      setReviews(reviewsWithReviewers);
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
        <div className="mb-4 flex items-center space-x-4">
          <button
            onClick={() => {
              if (isFromDashboard && isAuthenticated) {
                navigate('/dashboard');
              } else {
                navigate('/properties' + (isFromDashboard ? '?from=dashboard' : ''));
              }
            }}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{isFromDashboard && isAuthenticated ? 'Retour au tableau de bord' : 'Retour aux propriétés'}</span>
          </button>
        </div>

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
                  onError={() => {
                    // Image de fallback gérée par le composant OptimizedImage
                  }}
                />
                
                {/* Légende de l'image */}
                {property.imageCaptions && property.imageCaptions.length > 0 && (
                  (() => {
                    const currentImageUrl = normalizedImages[currentImageIndex] || normalizedImages[0];
                    const captionData = property.imageCaptions.find((c: any) => c.url === currentImageUrl);
                    return captionData && captionData.caption ? (
                      <div className="absolute bottom-16 left-4 right-4 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg">
                        <p className="text-sm font-medium">{captionData.caption}</p>
                      </div>
                    ) : null;
                  })()
                )}
                
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

              {/* Miniatures avec légendes */}
              {normalizedImages.length > 1 && (
                <div className="grid grid-cols-5 gap-2 mt-4">
                  {normalizedImages.slice(0, 5).map((image, index) => {
                    const captionData = property.imageCaptions?.find((c: any) => c.url === image);
                    return (
                      <div key={index} className="relative">
                        <button
                          onClick={() => setCurrentImageIndex(index)}
                          className={`aspect-video rounded-lg overflow-hidden border-2 transition-all w-full ${
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
                        {captionData && captionData.caption && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs px-1 py-0.5 rounded-b-lg truncate">
                            {captionData.caption}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
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
            {property.amenities && property.amenities.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-semibold font-heading text-primary mb-4">
                  Équipements proposés
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {property.amenities.map((amenity: string, index: number) => {
                    const amenityInfo = amenityIcons[amenity as keyof typeof amenityIcons];
                    return amenityInfo ? (
                      <div key={index} className="flex items-center space-x-3">
                        <amenityInfo.icon className="w-5 h-5 text-primary" />
                        <span className="text-secondary">{amenityInfo.label}</span>
                      </div>
                    ) : (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                        </div>
                        <span className="text-secondary">{amenity}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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

            {/* Carte de localisation */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold font-heading text-primary mb-4 flex items-center">
                <MapPin className="w-6 h-6 mr-2" />
                Où vous serez
              </h3>
              <div className="mb-4">
                <p className="text-secondary">
                  {property.location}
                  {property.commune && `, ${property.commune}`}
                </p>
              </div>
              {(property.latitude && property.longitude) ? (
                <>
                  <div className="rounded-lg overflow-hidden border border-gray-200">
                    <iframe
                      width="100%"
                      height="400"
                      style={{ border: 0 }}
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${property.longitude - 0.01},${property.latitude - 0.01},${property.longitude + 0.01},${property.latitude + 0.01}&layer=mapnik&marker=${property.latitude},${property.longitude}`}
                      allowFullScreen
                      title="Localisation de la propriété"
                    ></iframe>
                  </div>
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${property.latitude}&mlon=${property.longitude}#map=15/${property.latitude}/${property.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 text-sm mt-3 inline-block hover:text-blue-800 hover:underline"
                  >
                    Voir sur OpenStreetMap →
                  </a>
                </>
              ) : (
                <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">La localisation sur la carte n'est pas disponible pour cette propriété.</p>
                  <p className="text-sm text-gray-500 mt-2">L'hôte peut ajouter les coordonnées GPS lors de la création de l'annonce.</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar de réservation */}
          <div className="lg:col-span-1 space-y-6">
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
                // La redirection est gérée dans RealTimeBooking
                // Ici on peut juste logger ou faire d'autres actions si nécessaire
                console.log('Réservation créée:', reservationId);
              }}
            />

            {/* Informations sur l'hôte */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-primary mb-2">
                    Hébergement proposé par l'hôte
                  </h3>
                  {hostInfo && (
                    <div className="text-sm text-secondary mb-2">
                      <p className="font-medium">
                        {hostInfo.first_name} {hostInfo.last_name}
                      </p>
                      {hostInfo.created_at && (
                        <p className="text-gray-500">
                          Membre depuis {new Date(hostInfo.created_at).getFullYear()}
                        </p>
                      )}
                    </div>
                  )}
                  <div className="flex items-center space-x-4 text-secondary text-sm">
                    <span>{property.guests} voyageurs</span>
                    <span>{property.bedrooms} chambres</span>
                    <span>{property.beds} lits</span>
                    <span>{property.bathrooms} salles de bain</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => navigate('/messaging')}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Contacter l'hôte</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailPage;