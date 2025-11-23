import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Star, ThumbsUp, ThumbsDown, MessageCircle, Calendar, User, Home, CheckCircle, AlertCircle } from 'lucide-react';

interface Review {
  id: string;
  reservation_id: string;
  property_id: string;
  guest_id: string;
  rating: number;
  comment: string;
  created_at: string;
  guest_name?: string;
  property_title?: string;
  reservation_dates?: {
    check_in: string;
    check_out: string;
  };
}

interface Property {
  id: string;
  title: string;
  address: string;
  images: string[];
}

interface Reservation {
  id: string;
  property_id: string;
  check_in: string;
  check_out: string;
  status: string;
}

interface ReviewsFormProps {
  userType: 'owner' | 'admin' | 'traveler';
  propertyId?: string;
  reservationId?: string;
  onSuccess?: () => void;
}

const ReviewsForm: React.FC<ReviewsFormProps> = ({
  userType,
  propertyId,
  reservationId,
  onSuccess
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<string>('');
  const [newReview, setNewReview] = useState({
    rating: 0,
    comment: '',
    aspects: {
      property: 0,        // Note sur la propriété
      arrival: 0,         // Note sur l'arrivée
      welcome: 0,         // Note sur l'accueil
      communication: 0    // Note sur la communication
    }
  });
  const [filterProperty, setFilterProperty] = useState('');
  const [filterRating, setFilterRating] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Charger les avis selon le type d'utilisateur
      let reviewsQuery = supabase
        .from('reviews')
        .select('*');

      if (userType === 'owner') {
        // Charger les avis des propriétés de l'utilisateur
        const { data: userProperties } = await supabase
          .from('properties')
          .select('id')
          .eq('owner_id', user.id);

        const propertyIds = userProperties?.map(p => p.id) || [];
        if (propertyIds.length > 0) {
          reviewsQuery = reviewsQuery.in('property_id', propertyIds);
        } else {
          reviewsQuery = reviewsQuery.eq('property_id', 'no-properties');
        }
      } else if (userType === 'traveler') {
        // Charger les avis de l'utilisateur
        reviewsQuery = reviewsQuery.eq('guest_id', user.id);
      }

      const { data: reviewsData, error } = await reviewsQuery;
      if (error) throw error;

      let enrichedReviews = reviewsData || [];
      if (enrichedReviews.length > 0) {
        const reviewerIds = [...new Set(enrichedReviews.map(review => review.reviewer_id || review.guest_id).filter(Boolean))];
        const propertyIds = [...new Set(enrichedReviews.map(review => review.property_id).filter(Boolean))];
        const reservationIds = [...new Set(enrichedReviews.map(review => review.reservation_id).filter(Boolean))];

        if (reviewerIds.length > 0) {
          const { data: reviewers } = await supabase
            .from('user_profiles')
            .select('id, first_name, last_name')
            .in('id', reviewerIds);

          if (reviewers) {
            const reviewersMap = new Map(reviewers.map(reviewer => [reviewer.id, reviewer]));
            enrichedReviews = enrichedReviews.map(review => ({
              ...review,
              guest_name: (() => {
                const reviewer = reviewersMap.get(review.reviewer_id || review.guest_id);
                return reviewer ? `${reviewer.first_name || ''} ${reviewer.last_name || ''}`.trim() : review.guest_name;
              })()
            }));
          }
        }

        if (propertyIds.length > 0) {
          const { data: properties } = await supabase
            .from('properties')
            .select('id, title, address')
            .in('id', propertyIds);

          if (properties) {
            const propertiesMap = new Map(properties.map(property => [property.id, property]));
            enrichedReviews = enrichedReviews.map(review => ({
              ...review,
              property_title: propertiesMap.get(review.property_id)?.title || review.property_title
            }));
          }
        }

        if (reservationIds.length > 0) {
          const { data: reservationsData } = await supabase
            .from('reservations')
            .select('id, check_in, check_out')
            .in('id', reservationIds);

          if (reservationsData) {
            const reservationsMap = new Map(reservationsData.map(reservation => [reservation.id, reservation]));
            enrichedReviews = enrichedReviews.map(review => ({
              ...review,
              reservation_dates: review.reservation_id ? {
                check_in: reservationsMap.get(review.reservation_id)?.check_in,
                check_out: reservationsMap.get(review.reservation_id)?.check_out
              } : review.reservation_dates
            }));
          }
        }
      }

      setReviews(enrichedReviews);

      // Charger les propriétés pour les filtres
      if (userType === 'owner') {
        const { data: propertiesData } = await supabase
          .from('properties')
          .select('id, title, address, images')
          .eq('owner_id', user.id);
        setProperties(propertiesData || []);
      } else if (userType === 'admin') {
        const { data: propertiesData } = await supabase
          .from('properties')
          .select('id, title, address, images');
        setProperties(propertiesData || []);
      }

      // Charger les réservations pour les voyageurs (terminées ou confirmées avec check-out passé)
      if (userType === 'traveler') {
        const today = new Date().toISOString().split('T')[0];
        
        // Charger toutes les réservations confirmées ou terminées avec check-out passé
        const { data: reservationsData } = await supabase
          .from('reservations')
          .select('id, property_id, check_in, check_out, status, total_amount, created_at')
          .eq('guest_id', user.id)
          .in('status', ['confirmed', 'completed'])
          .lt('check_out', today) // Seulement les réservations avec check-out passé
          .order('check_out', { ascending: false }); // Plus récentes en premier
        
        // Vérifier quelles réservations ont déjà un avis
        if (reservationsData && reservationsData.length > 0) {
          const reservationIds = reservationsData.map(r => r.id);
          // Essayer avec reviewer_id d'abord, puis guest_id si nécessaire
          let existingReviews: any[] = [];
          
          const { data: reviews1 } = await supabase
            .from('reviews')
            .select('reservation_id, property_id')
            .in('reservation_id', reservationIds)
            .eq('reviewer_id', user.id);
          
          if (reviews1 && reviews1.length > 0) {
            existingReviews = reviews1;
          } else {
            // Essayer avec guest_id
            const { data: reviews2 } = await supabase
              .from('reviews')
              .select('reservation_id, property_id')
              .in('reservation_id', reservationIds)
              .eq('guest_id', user.id);
            
            if (reviews2) {
              existingReviews = reviews2;
            }
          }
          
          const reviewedReservationIds = new Set(existingReviews?.map(r => r.reservation_id).filter(Boolean) || []);
          // Filtrer pour ne garder que les réservations sans avis
          const reservationsWithoutReview = reservationsData.filter(r => !reviewedReservationIds.has(r.id));
          
          // Enrichir les réservations avec les détails des propriétés
          if (reservationsWithoutReview.length > 0) {
            const propertyIds = [...new Set(reservationsWithoutReview.map(r => r.property_id).filter(Boolean))];
            
            if (propertyIds.length > 0) {
              const { data: propertiesData } = await supabase
                .from('properties')
                .select('id, title, address, images')
                .in('id', propertyIds);
              
              if (propertiesData) {
                const propertiesMap = new Map(propertiesData.map(p => [p.id, p]));
                const enrichedReservations = reservationsWithoutReview.map(r => ({
                  ...r,
                  property: propertiesMap.get(r.property_id) || null
                }));
                setReservations(enrichedReservations);
              } else {
                setReservations(reservationsWithoutReview);
              }
            } else {
              setReservations(reservationsWithoutReview);
            }
          } else {
            setReservations([]);
          }
        } else {
          setReservations([]);
        }
      }

    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReservation || newReview.rating === 0) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Récupérer les informations de la réservation
      const reservation = reservations.find(r => r.id === selectedReservation);
      if (!reservation) return;

      // Vérifier la structure de la table reviews (peut être reviewer_id ou guest_id)
      const reviewData: any = {
        reservation_id: selectedReservation,
        property_id: reservation.property_id,
        rating: newReview.rating,
        comment: newReview.comment || ''
      };

      // Essayer avec reviewer_id d'abord (structure la plus récente), puis guest_id
      // Supabase ignorera les colonnes qui n'existent pas
      reviewData.reviewer_id = user.id;
      reviewData.guest_id = user.id;
      
      // Ajouter les notes détaillées spécifiques
      if (newReview.aspects.property > 0) {
        reviewData.accuracy_rating = newReview.aspects.property; // Utiliser accuracy_rating pour la propriété
      }
      if (newReview.aspects.arrival > 0) {
        reviewData.checkin_rating = newReview.aspects.arrival; // Utiliser checkin_rating pour l'arrivée
      }
      if (newReview.aspects.welcome > 0) {
        reviewData.cleanliness_rating = newReview.aspects.welcome; // Utiliser cleanliness_rating pour l'accueil
      }
      if (newReview.aspects.communication > 0) {
        reviewData.communication_rating = newReview.aspects.communication;
      }

      const { error } = await supabase
        .from('reviews')
        .insert([reviewData]);

      if (error) throw error;

      setNewReview({
        rating: 0,
        comment: '',
        aspects: {
          property: 0,
          arrival: 0,
          welcome: 0,
          communication: 0
        }
      });
      setSelectedReservation('');
      setShowReviewForm(false);
      loadData();
      onSuccess?.();
    } catch (error) {
      console.error('Erreur soumission avis:', error);
      alert('Erreur lors de la soumission de l\'avis');
    }
  };

  const getRatingStars = (rating: number, interactive: boolean = false, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onRatingChange?.(star)}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
            disabled={!interactive}
          >
            <Star
              className={`w-5 h-5 ${
                star <= rating
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 4) return 'Très bien';
    if (rating >= 3) return 'Bien';
    if (rating >= 2) return 'Moyen';
    return 'Médiocre';
  };

  const filteredReviews = reviews.filter(review => {
    if (filterProperty && review.property_id !== filterProperty) return false;
    if (filterRating && review.rating !== Number(filterRating)) return false;
    return true;
  });

  const getAverageRating = () => {
    if (filteredReviews.length === 0) return 0;
    const sum = filteredReviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / filteredReviews.length;
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    filteredReviews.forEach(review => {
      distribution[review.rating as keyof typeof distribution]++;
    });
    return distribution;
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Avis et commentaires
            </h2>
            <p className="text-gray-600">
              {userType === 'traveler' 
                ? 'Consultez vos avis et donnez votre avis sur vos séjours'
                : 'Gérez les avis et commentaires des utilisateurs'}
            </p>
          </div>
          {userType === 'traveler' && reservations.length > 0 && (
            <button
              onClick={() => setShowReviewForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Star className="w-4 h-4" />
              <span>Laisser un avis</span>
            </button>
          )}
        </div>
      </div>

      {/* Statistiques des avis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Note moyenne</p>
              <p className={`text-3xl font-bold ${getRatingColor(getAverageRating())}`}>
                {getAverageRating().toFixed(1)}
              </p>
              <p className="text-sm text-gray-500">
                {getRatingLabel(getAverageRating())}
              </p>
            </div>
            <div className="text-right">
              {getRatingStars(getAverageRating())}
              <p className="text-sm text-gray-500 mt-1">
                {filteredReviews.length} avis
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Répartition des notes</p>
            {Object.entries(getRatingDistribution())
              .reverse()
              .map(([rating, count]) => (
                <div key={rating} className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 w-2">{rating}</span>
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{
                        width: `${filteredReviews.length > 0 ? (count / filteredReviews.length) * 100 : 0}%`
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-8">{count}</span>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total avis</span>
              <span className="text-2xl font-bold text-gray-900">{filteredReviews.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Avis récents</span>
              <span className="text-sm text-gray-900">
                {reviews.filter(r => {
                  const reviewDate = new Date(r.created_at);
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return reviewDate > weekAgo;
                }).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Réservations disponibles pour donner un avis (voyageur uniquement) */}
      {userType === 'traveler' && reservations.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Réservations disponibles pour donner un avis
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {reservations.length} réservation{reservations.length > 1 ? 's' : ''} en attente d'avis
              </p>
            </div>
            <button
              onClick={() => setShowReviewForm(true)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors flex items-center space-x-2"
            >
              <Star className="w-4 h-4" />
              <span>Donner un avis</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reservations.map((reservation: any) => {
              const property = reservation.property;
              return (
                <div
                  key={reservation.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedReservation(reservation.id);
                    setShowReviewForm(true);
                  }}
                >
                  {property?.images && Array.isArray(property.images) && property.images.length > 0 && (
                    <div className="mb-3">
                      <img
                        src={typeof property.images[0] === 'string' ? property.images[0] : property.images[0]?.url || property.images[0]}
                        alt={property.title}
                        className="w-full h-32 object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <h4 className="font-semibold text-gray-900 mb-1 flex items-center">
                    <Home className="w-4 h-4 mr-1 text-gray-500" />
                    {property?.title || 'Propriété'}
                  </h4>
                  {property?.address && (
                    <p className="text-xs text-gray-500 mb-2">{property.address}</p>
                  )}
                  <div className="flex items-center space-x-3 text-sm text-gray-600 mb-2">
                    <span className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(reservation.check_in).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - {new Date(reservation.check_out).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  {reservation.total_amount && (
                    <p className="text-sm font-medium text-gray-900">
                      ${Number(reservation.total_amount).toFixed(2)}
                    </p>
                  )}
                  <button
                    className="mt-3 w-full px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors text-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedReservation(reservation.id);
                      setShowReviewForm(true);
                    }}
                  >
                    Donner un avis
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Message si aucune réservation disponible */}
      {userType === 'traveler' && reservations.length === 0 && !loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-start space-x-3">
            <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">
                Aucune réservation disponible pour donner un avis
              </h4>
              <p className="text-sm text-blue-700">
                Vous pouvez donner un avis uniquement pour les réservations terminées (check-out passé). 
                Une fois votre séjour terminé, vous pourrez partager votre expérience.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {properties.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Propriété
              </label>
              <select
                value={filterProperty}
                onChange={(e) => setFilterProperty(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Toutes les propriétés</option>
                {properties.map(property => (
                  <option key={property.id} value={property.id}>
                    {property.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Note
            </label>
            <select
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Toutes les notes</option>
              <option value="5">5 étoiles</option>
              <option value="4">4 étoiles</option>
              <option value="3">3 étoiles</option>
              <option value="2">2 étoiles</option>
              <option value="1">1 étoile</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des avis */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Avis ({filteredReviews.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Chargement...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="p-8 text-center">
            <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucun avis trouvé</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredReviews.map((review) => (
              <div key={review.id} className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {review.guest_name || 'Utilisateur anonyme'}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          {getRatingStars(review.rating)}
                          <span className={`text-sm font-medium ${getRatingColor(review.rating)}`}>
                            {review.rating}/5
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {new Date(review.created_at).toLocaleDateString('fr-FR')}
                        </p>
                        {review.reservation_dates && (
                          <p className="text-xs text-gray-400">
                            Séjour du {new Date(review.reservation_dates.check_in).toLocaleDateString('fr-FR')} 
                            au {new Date(review.reservation_dates.check_out).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-sm text-gray-900">{review.comment}</p>
                    </div>
                    {review.property_title && (
                      <div className="mt-2 flex items-center space-x-2 text-sm text-gray-500">
                        <Home className="w-4 h-4" />
                        <span>{review.property_title}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal nouveau avis */}
      {showReviewForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Laisser un avis
                </h3>
                <button
                  onClick={() => setShowReviewForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <AlertCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={submitReview} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sélectionner une réservation *
                  </label>
                  {reservations.length === 0 ? (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-md text-center">
                      <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        Aucune réservation disponible pour donner un avis.
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Vous pouvez donner un avis uniquement pour les réservations terminées (check-out passé).
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-md p-2">
                      {reservations.map(reservation => {
                        const reservationWithProperty = reservation as any;
                        const property = reservationWithProperty.property;
                        return (
                          <label
                            key={reservation.id}
                            className={`block p-3 border rounded-lg cursor-pointer transition-all ${
                              selectedReservation === reservation.id
                                ? 'border-primary bg-primary/5'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="reservation"
                              value={reservation.id}
                              checked={selectedReservation === reservation.id}
                              onChange={(e) => setSelectedReservation(e.target.value)}
                              className="sr-only"
                            />
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <Home className="w-4 h-4 text-gray-500" />
                                  <span className="font-semibold text-gray-900">
                                    {property?.title || 'Propriété'}
                                  </span>
                                </div>
                                {property?.address && (
                                  <p className="text-xs text-gray-500 mb-2">{property.address}</p>
                                )}
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                  <span className="flex items-center">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {new Date(reservation.check_in).toLocaleDateString('fr-FR')} - {new Date(reservation.check_out).toLocaleDateString('fr-FR')}
                                  </span>
                                  {reservationWithProperty.total_amount && (
                                    <span className="flex items-center">
                                      <span className="mr-1">$</span>
                                      {Number(reservationWithProperty.total_amount).toFixed(2)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {selectedReservation === reservation.id && (
                                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 ml-2" />
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Note globale *
                  </label>
                  <div className="flex items-center space-x-2">
                    {getRatingStars(newReview.rating, true, (rating) => 
                      setNewReview(prev => ({ ...prev, rating }))
                    )}
                    <span className="text-sm text-gray-500 ml-2">
                      {newReview.rating > 0 && `${newReview.rating}/5`}
                    </span>
                  </div>
                </div>

                {/* Évaluations détaillées */}
                <div className="space-y-4 border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Évaluations détaillées (optionnel)
                  </h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      La propriété *
                    </label>
                    <div className="flex items-center space-x-2">
                      {getRatingStars(newReview.aspects.property, true, (rating) => 
                        setNewReview(prev => ({ 
                          ...prev, 
                          aspects: { ...prev.aspects, property: rating }
                        }))
                      )}
                      <span className="text-sm text-gray-500 ml-2">
                        {newReview.aspects.property > 0 && `${newReview.aspects.property}/5`}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Qualité et état de la propriété</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      L'arrivée *
                    </label>
                    <div className="flex items-center space-x-2">
                      {getRatingStars(newReview.aspects.arrival, true, (rating) => 
                        setNewReview(prev => ({ 
                          ...prev, 
                          aspects: { ...prev.aspects, arrival: rating }
                        }))
                      )}
                      <span className="text-sm text-gray-500 ml-2">
                        {newReview.aspects.arrival > 0 && `${newReview.aspects.arrival}/5`}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Processus d'arrivée et remise des clés</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      L'accueil *
                    </label>
                    <div className="flex items-center space-x-2">
                      {getRatingStars(newReview.aspects.welcome, true, (rating) => 
                        setNewReview(prev => ({ 
                          ...prev, 
                          aspects: { ...prev.aspects, welcome: rating }
                        }))
                      )}
                      <span className="text-sm text-gray-500 ml-2">
                        {newReview.aspects.welcome > 0 && `${newReview.aspects.welcome}/5`}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Qualité de l'accueil de l'hôte</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      La communication *
                    </label>
                    <div className="flex items-center space-x-2">
                      {getRatingStars(newReview.aspects.communication, true, (rating) => 
                        setNewReview(prev => ({ 
                          ...prev, 
                          aspects: { ...prev.aspects, communication: rating }
                        }))
                      )}
                      <span className="text-sm text-gray-500 ml-2">
                        {newReview.aspects.communication > 0 && `${newReview.aspects.communication}/5`}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Réactivité et qualité de la communication</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Commentaire
                  </label>
                  <textarea
                    value={newReview.comment}
                    onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Partagez votre expérience détaillée..."
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={newReview.rating === 0 || 
                             newReview.aspects.property === 0 || 
                             newReview.aspects.arrival === 0 || 
                             newReview.aspects.welcome === 0 || 
                             newReview.aspects.communication === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Publier l'avis
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewsForm;
