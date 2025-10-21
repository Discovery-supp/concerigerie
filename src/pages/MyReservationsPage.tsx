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

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate('/login');
        return;
      }

      const data = await reservationsService.getUserReservations(user.id);
      setReservations(data);
    } catch (error) {
      console.error('Erreur chargement réservations:', error);
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
      pending: { text: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { text: 'Confirmée', color: 'bg-green-100 text-green-800' },
      cancelled: { text: 'Annulée', color: 'bg-red-100 text-red-800' },
      completed: { text: 'Terminée', color: 'bg-blue-100 text-blue-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
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
        return checkIn > today && reservation.status !== 'cancelled';
      case 'past':
        return checkOut < today;
      case 'cancelled':
        return reservation.status === 'cancelled';
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
                    {reservation.status !== 'cancelled' && reservation.status !== 'completed' && (
                      <button
                        onClick={() => {
                          if (confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
                            reservationsService.cancelReservation(reservation.id).then(() => {
                              loadReservations();
                            });
                          }
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Annuler la réservation
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyReservationsPage;
