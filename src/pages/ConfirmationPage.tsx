import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, XCircle, Calendar, MapPin, Users, DollarSign, CreditCard, Download } from 'lucide-react';
import reservationsService from '../services/reservations';
import paymentsService from '../services/payments';

interface ReservationDetails {
  id: string;
  property: any;
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  infants: number;
  pets: number;
  total_amount: number;
  payment_status: string;
  status: string;
  created_at: string;
  transaction?: any;
}

const ConfirmationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reservation, setReservation] = useState<ReservationDetails | null>(null);
  const [error, setError] = useState('');

  const reservationId = searchParams.get('reservation_id');
  const transactionId = searchParams.get('transaction_id');

  useEffect(() => {
    if (reservationId) {
      loadReservationDetails();
    }
  }, [reservationId]);

  const loadReservationDetails = async () => {
    try {
      setLoading(true);
      const data = await reservationsService.getReservationById(reservationId!);
      setReservation(data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement de la réservation');
    } finally {
      setLoading(false);
    }
  };

  const calculateNights = () => {
    if (!reservation) return 0;
    const checkIn = new Date(reservation.check_in);
    const checkOut = new Date(reservation.check_out);
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getStatusInfo = () => {
    if (!reservation) return null;

    if (reservation.payment_status === 'paid') {
      return {
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        title: 'Réservation Confirmée !',
        message: 'Votre paiement a été traité avec succès. Vous allez recevoir un email de confirmation avec tous les détails.'
      };
    } else if (reservation.payment_status === 'pending') {
      return {
        icon: Clock,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        title: 'Paiement en Attente',
        message: 'Votre réservation est enregistrée. Veuillez compléter le paiement pour la confirmer définitivement.'
      };
    } else {
      return {
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        title: 'Paiement Échoué',
        message: 'Le paiement n\'a pas pu être traité. Veuillez réessayer ou contacter notre support.'
      };
    }
  };

  const handleDownloadReceipt = () => {
    alert('Le téléchargement du reçu sera disponible prochainement.');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de votre réservation...</p>
        </div>
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8 text-center">
          <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-6">{error || 'Réservation introuvable'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo?.icon || CheckCircle;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête de confirmation */}
        <div className={`${statusInfo?.bgColor} rounded-2xl p-8 mb-8 text-center`}>
          <StatusIcon className={`w-20 h-20 ${statusInfo?.color} mx-auto mb-4`} />
          <h1 className={`text-3xl font-bold ${statusInfo?.color} mb-2`}>
            {statusInfo?.title}
          </h1>
          <p className="text-gray-700 text-lg mb-4">
            {statusInfo?.message}
          </p>
          {transactionId && (
            <p className="text-sm text-gray-600">
              Référence de transaction: <span className="font-mono font-semibold">{transactionId}</span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Détails de la réservation */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informations sur la propriété */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Détails de la réservation</h2>

              {reservation.property && (
                <div className="flex items-start space-x-4 mb-6">
                  {reservation.property.images?.[0] && (
                    <img
                      src={reservation.property.images[0]}
                      alt={reservation.property.title}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 mb-1">
                      {reservation.property.title}
                    </h3>
                    <div className="flex items-center text-gray-600 text-sm">
                      <MapPin className="w-4 h-4 mr-1" />
                      {reservation.property.address}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div className="flex items-center text-gray-700">
                    <Calendar className="w-5 h-5 mr-3 text-blue-600" />
                    <span>Arrivée</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {new Date(reservation.check_in).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div className="flex items-center text-gray-700">
                    <Calendar className="w-5 h-5 mr-3 text-blue-600" />
                    <span>Départ</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {new Date(reservation.check_out).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div className="flex items-center text-gray-700">
                    <Users className="w-5 h-5 mr-3 text-blue-600" />
                    <span>Voyageurs</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {reservation.adults} adulte{reservation.adults > 1 ? 's' : ''}
                    {reservation.children > 0 && `, ${reservation.children} enfant${reservation.children > 1 ? 's' : ''}`}
                    {reservation.infants > 0 && `, ${reservation.infants} nourrisson${reservation.infants > 1 ? 's' : ''}`}
                    {reservation.pets > 0 && `, ${reservation.pets} animal${reservation.pets > 1 ? 'aux' : ''}`}
                  </span>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center text-gray-700">
                    <Clock className="w-5 h-5 mr-3 text-blue-600" />
                    <span>Durée du séjour</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {calculateNights()} nuit{calculateNights() > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Instructions suivantes */}
            <div className="bg-blue-50 rounded-2xl p-6">
              <h3 className="font-bold text-gray-900 mb-4">Prochaines étapes</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">
                    Vous recevrez un email de confirmation avec toutes les informations
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">
                    Le propriétaire vous contactera 24h avant votre arrivée
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">
                    Consultez votre tableau de bord pour gérer votre réservation
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Récapitulatif du paiement */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-blue-600" />
                Récapitulatif du paiement
              </h3>

              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between text-gray-700">
                  <span>Montant total</span>
                  <span className="font-semibold">${reservation.total_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Statut du paiement</span>
                  <span className={`font-semibold ${
                    reservation.payment_status === 'paid' ? 'text-green-600' :
                    reservation.payment_status === 'pending' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {reservation.payment_status === 'paid' ? 'Payé' :
                     reservation.payment_status === 'pending' ? 'En attente' :
                     'Échoué'}
                  </span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Méthode de paiement</span>
                  <span className="font-semibold">{reservation.payment_method || 'N/A'}</span>
                </div>
              </div>

              <div className="space-y-3">
                {reservation.payment_status === 'paid' && (
                  <button
                    onClick={handleDownloadReceipt}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Download className="w-5 h-5" />
                    <span>Télécharger le reçu</span>
                  </button>
                )}

                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Voir mes réservations
                </button>

                <button
                  onClick={() => navigate('/')}
                  className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Retour à l'accueil
                </button>
              </div>

              {reservation.payment_status === 'pending' && (
                <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Votre réservation sera confirmée dès réception du paiement.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Besoin d'aide */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6 text-center">
          <h3 className="font-bold text-gray-900 mb-2">Besoin d'aide ?</h3>
          <p className="text-gray-600 mb-4">
            Notre équipe est disponible 24/7 pour répondre à vos questions
          </p>
          <div className="flex justify-center space-x-4">
            <a
              href="mailto:support@nzooimmo.com"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Nous contacter
            </a>
            <a
              href="tel:+243123456789"
              className="px-6 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Appeler
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPage;
