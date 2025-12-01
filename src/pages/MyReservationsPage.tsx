import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, DollarSign, CheckCircle, Clock, XCircle, User } from 'lucide-react';
import reservationsService from '../services/reservations';
import { supabase } from '../lib/supabase';

interface Reservation {
  id: string;
  property: any;
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  total_amount: number;
  payment_status: string;
  status: string;
  created_at: string;
}

const MyReservationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'cancelled'>('all');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    loadReservations();
    
    // S'abonner aux changements de réservations en temps réel
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const reservationChannel = supabase
        .channel(`reservations-changes-${user.id}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'reservations',
            filter: `guest_id=eq.${user.id}`
          },
          (payload) => {
            // eslint-disable-next-line no-console
            console.log('[MyReservations] realtime event:', payload.eventType, payload.new?.id || payload.old?.id);
            loadReservations(); // Recharger les réservations
          }
        )
        .subscribe();

      // Fallback polling toutes les 30s au cas où Realtime échoue
      const pollId = window.setInterval(() => {
        loadReservations();
      }, 30000);

      return () => {
        window.clearInterval(pollId);
        supabase.removeChannel(reservationChannel);
      };
    };

    const cleanup = setupRealtimeSubscription();
    return () => {
      cleanup.then(cleanupFn => cleanupFn && cleanupFn());
    };
  }, []);

  // Recharger les réservations quand on revient sur la page
  useEffect(() => {
    const handleFocus = () => {
      loadReservations();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const loadReservations = async () => {
    try {
      setLoading(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError) {
        console.error('[MyReservations] Erreur authentification:', authError);
        navigate('/login');
        return;
      }

      if (!user) {
        console.warn('[MyReservations] Aucun utilisateur connecté');
        navigate('/login');
        return;
      }

      console.log('[MyReservations] Utilisateur connecté:', user.id, user.email);

      // Vérifier directement dans la base de données
      const { data: directCheck, error: directError } = await supabase
        .from('reservations')
        .select('id, guest_id, property_id, status, created_at')
        .eq('guest_id', user.id)
        .limit(5);

      console.log('[MyReservations] Vérification directe:', {
        count: directCheck?.length || 0,
        error: directError,
        sample: directCheck?.[0]
      });

      const data = await reservationsService.getUserReservations(user.id);
      console.log('[MyReservations] Réservations chargées:', {
        count: Array.isArray(data) ? data.length : 0,
        data: data,
        firstReservation: Array.isArray(data) && data.length > 0 ? data[0] : null
      });
      
      setReservations(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('[MyReservations] Erreur chargement réservations:', {
        message: error.message,
        code: error.code,
        details: error,
        stack: error.stack
      });
      setReservations([]); // S'assurer que l'état est vide en cas d'erreur
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { icon: CheckCircle, text: 'Payé', color: 'bg-green-100 text-green-800' },
      pending: { icon: Clock, text: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
      failed: { icon: XCircle, text: 'Échoué', color: 'bg-red-100 text-red-800' },
      refunded: { icon: CheckCircle, text: 'Remboursé', color: 'bg-blue-100 text-blue-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="w-4 h-4 mr-1" />
        {config.text}
      </span>
    );
  };

  const getReservationStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { text: 'En attente de confirmation', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      confirmed: { text: 'Confirmée', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { text: 'Annulée', color: 'bg-red-100 text-red-800', icon: XCircle },
      completed: { text: 'Terminée', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      pending_cancellation: { text: 'Demande d\'annulation en attente', color: 'bg-orange-100 text-orange-800', icon: Clock }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon || Clock;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="w-4 h-4 mr-1" />
        {config.text}
      </span>
    );
  };

  const filteredReservations = reservations.filter(reservation => {
    const today = new Date();
    const checkIn = new Date(reservation.check_in);
    const checkOut = new Date(reservation.check_out);

    switch (filter) {
      case 'upcoming':
        return checkIn > today && reservation.status !== 'cancelled' && reservation.status !== 'pending_cancellation';
      case 'past':
        return checkOut < today;
      case 'cancelled':
        return reservation.status === 'cancelled' || reservation.status === 'pending_cancellation';
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de vos réservations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Mes Réservations</h1>
          <p className="text-xl text-gray-600">
            Gérez et suivez toutes vos réservations
          </p>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Toutes ({reservations.length})
            </button>
            <button
              onClick={() => setFilter('upcoming')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                filter === 'upcoming'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              À venir
            </button>
            <button
              onClick={() => setFilter('past')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                filter === 'past'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Passées
            </button>
            <button
              onClick={() => setFilter('cancelled')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                filter === 'cancelled'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Annulées
            </button>
          </div>
        </div>

        {/* Liste des réservations */}
        {filteredReservations.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Aucune réservation trouvée
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all'
                ? 'Vous n\'avez pas encore de réservation'
                : `Vous n'avez pas de réservation ${
                    filter === 'upcoming' ? 'à venir' :
                    filter === 'past' ? 'passée' : 'annulée'
                  }`}
            </p>
            <button
              onClick={() => navigate('/properties')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Découvrir les propriétés
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredReservations.map((reservation) => (
              <div
                key={reservation.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:space-x-6">
                    {/* Image de la propriété */}
                    {reservation.property?.images?.[0] && (
                      <div className="w-full lg:w-48 h-48 flex-shrink-0 mb-4 lg:mb-0">
                        <img
                          src={reservation.property.images[0]}
                          alt={reservation.property.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                    )}

                    {/* Détails de la réservation */}
                    <div className="flex-1 space-y-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {reservation.property?.title || 'Propriété'}
                        </h3>
                        <div className="flex items-center text-gray-600 text-sm">
                          <MapPin className="w-4 h-4 mr-1" />
                          {reservation.property?.address || 'Adresse non disponible'}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center text-gray-700">
                          <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                          <div>
                            <div className="text-sm font-medium">Arrivée</div>
                            <div className="text-sm">
                              {new Date(reservation.check_in).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center text-gray-700">
                          <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                          <div>
                            <div className="text-sm font-medium">Départ</div>
                            <div className="text-sm">
                              {new Date(reservation.check_out).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center text-gray-700">
                          <User className="w-5 h-5 mr-2 text-blue-600" />
                          <div>
                            <div className="text-sm font-medium">Voyageurs</div>
                            <div className="text-sm">
                              {reservation.adults} adulte{reservation.adults > 1 ? 's' : ''}
                              {reservation.children > 0 && `, ${reservation.children} enfant${reservation.children > 1 ? 's' : ''}`}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center text-gray-700">
                          <DollarSign className="w-5 h-5 mr-2 text-blue-600" />
                          <div>
                            <div className="text-sm font-medium">Montant total</div>
                            <div className="text-sm font-semibold">
                              ${reservation.total_amount.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {getReservationStatusBadge(reservation.status)}
                        {getPaymentStatusBadge(reservation.payment_status)}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end space-x-3">
                    <button
                      onClick={() => navigate(`/confirmation?reservation_id=${reservation.id}`)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Voir les détails
                    </button>
                    {reservation.status !== 'cancelled' && reservation.status !== 'completed' && reservation.status !== 'pending_cancellation' && (
                      <button
                        onClick={() => {
                          setSelectedReservation(reservation.id);
                          setShowCancelModal(true);
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Demander l'annulation
                      </button>
                    )}
                    {reservation.status === 'pending_cancellation' && (
                      <div className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm">
                        Demande d'annulation en attente de traitement par l'administration
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de demande d'annulation */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Demander l'annulation</h3>
            <p className="text-gray-600 mb-4">
              Votre demande d'annulation sera envoyée à l'administration pour traitement.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Raison de l'annulation (optionnel)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                rows={4}
                placeholder="Expliquez la raison de votre demande d'annulation..."
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={async () => {
                  if (selectedReservation) {
                    try {
                      await reservationsService.requestCancellation(selectedReservation, cancelReason);
                      alert('Votre demande d\'annulation a été envoyée à l\'administration. Vous serez notifié de la décision.');
                      setShowCancelModal(false);
                      setSelectedReservation(null);
                      setCancelReason('');
                      loadReservations();
                    } catch (error: any) {
                      alert('Erreur lors de la demande d\'annulation: ' + error.message);
                    }
                  }
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Envoyer la demande
              </button>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedReservation(null);
                  setCancelReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyReservationsPage;
