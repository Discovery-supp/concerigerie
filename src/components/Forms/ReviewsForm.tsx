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
      cleanliness: 0,
      communication: 0,
      checkin: 0,
      accuracy: 0,
      location: 0,
      value: 0
    }
  });
  const [filterProperty, setFilterProperty] = useState('');
  const [filterRating, setFilterRating] = useState('');

  useEffect(() => {
    loadData();
  }, [reservationId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Charger les avis selon le type d'utilisateur
      let reviewsQuery = supabase
        .from('reviews')
        .select(`
          *,
          user_profiles!reviews_guest_id_fkey(first_name, last_name),
          properties!reviews_property_id_fkey(title, address),
          reservations!reviews_reservation_id_fkey(check_in, check_out)
        `);

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

      setReviews(reviewsData || []);

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

      // Charger les réservations éligibles pour les voyageurs
      if (userType === 'traveler') {
        // On part de toutes les réservations du voyageur
        let reservationsQuery = supabase
          .from('reservations')
          .select('id, property_id, check_in, check_out, status')
          .eq('guest_id', user.id);

        if (reservationId) {
          // Si une réservation précise est fournie (depuis /my-reservations),
          // on la charge toujours, même si le statut n'est pas encore "completed"
          reservationsQuery = reservationsQuery.eq('id', reservationId);
        } else {
          // Sinon, on propose uniquement les séjours déjà terminés (check_out dans le passé)
          const today = new Date().toISOString().split('T')[0];
          reservationsQuery = reservationsQuery.or(
            `and(status.eq.completed,check_out.lte.${today}),and(status.eq.confirmed,check_out.lte.${today})`
          );
        }

        const { data: reservationsData } = await reservationsQuery;
        const finalReservations = reservationsData || [];
        setReservations(finalReservations);

        // Pré‑sélectionner la réservation et ouvrir le formulaire si reservationId est fourni
        if (reservationId && finalReservations.length > 0) {
          setSelectedReservation(finalReservations[0].id);
          setShowReviewForm(true);
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

      const { error } = await supabase
        .from('reviews')
        .insert([{
          reservation_id: selectedReservation,
          property_id: reservation.property_id,
          guest_id: user.id,
          rating: newReview.rating,
          comment: newReview.comment
        }]);

      if (error) throw error;

      setNewReview({
        rating: 0,
        comment: '',
        aspects: {
          cleanliness: 0,
          communication: 0,
          checkin: 0,
          accuracy: 0,
          location: 0,
          value: 0
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
              Gérez les avis et commentaires des utilisateurs
            </p>
          </div>
          {userType === 'traveler' && (
            <button
              onClick={() => setShowReviewForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Star className="w-4 h-4" />
              <span>Laisser un commentaire</span>
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
                  <select
                    value={selectedReservation}
                    onChange={(e) => setSelectedReservation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Choisir une réservation</option>
                    {reservations.map(reservation => (
                      <option key={reservation.id} value={reservation.id}>
                        Réservation #{reservation.id.slice(-8)} - 
                        {new Date(reservation.check_in).toLocaleDateString('fr-FR')} au {new Date(reservation.check_out).toLocaleDateString('fr-FR')}
                      </option>
                    ))}
                  </select>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Commentaire
                  </label>
                  <textarea
                    value={newReview.comment}
                    onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Partagez votre expérience..."
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
                    disabled={newReview.rating === 0}
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
