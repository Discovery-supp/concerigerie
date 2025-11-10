import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, CreditCard, Shield, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import PaymentModal from './PaymentModal';

interface Property {
  id: string;
  title: string;
  price_per_night: number;
  cleaning_fee: number;
  max_guests: number;
  min_nights: number;
  max_nights: number;
  cancellation_policy: string;
  long_stay_discount_7?: number;
  long_stay_discount_30?: number;
}

interface RealTimeBookingProps {
  property: Property;
  onBookingSuccess?: (reservationId: string) => void;
}

const RealTimeBooking: React.FC<RealTimeBookingProps> = ({ property, onBookingSuccess }) => {
  const navigate = useNavigate();
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<'available' | 'unavailable' | 'checking' | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    checkIfOwner();
    loadBlockedDates();
    
    // S'abonner aux changements de réservations en temps réel
    const reservationChannel = supabase
      .channel('reservations-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'reservations' },
        (payload) => {
          console.log('Changement de réservation:', payload);
          loadBlockedDates(); // Recharger les dates bloquées
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(reservationChannel);
    };
  }, [property.id]);

  const checkIfOwner = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: propertyData } = await supabase
        .from('properties')
        .select('owner_id')
        .eq('id', property.id)
        .single();

      if (propertyData && propertyData.owner_id === user.id) {
        setIsOwner(true);
      }
    } catch (error) {
      console.error('Erreur vérification propriétaire:', error);
    }
  };

  useEffect(() => {
    if (checkIn && checkOut) {
      checkAvailability();
    }
  }, [checkIn, checkOut, guests]);

  const loadBlockedDates = async () => {
    try {
      // Charger les dates bloquées manuellement depuis la propriété
      const { data: propertyData } = await supabase
        .from('properties')
        .select('blocked_dates')
        .eq('id', property.id)
        .single();

      const manuallyBlocked: string[] = [];
      if (propertyData?.blocked_dates) {
        const dates = typeof propertyData.blocked_dates === 'string'
          ? JSON.parse(propertyData.blocked_dates)
          : propertyData.blocked_dates;
        if (Array.isArray(dates)) {
          manuallyBlocked.push(...dates);
        }
      }

      // Charger les dates bloquées par les réservations
      const { data } = await supabase
        .from('reservations')
        .select('check_in, check_out, status')
        .eq('property_id', property.id)
        .in('status', ['confirmed', 'pending']);

      const reservationBlocked: string[] = [];
      data?.forEach(reservation => {
        const start = new Date(reservation.check_in);
        const end = new Date(reservation.check_out);
        for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
          reservationBlocked.push(d.toISOString().split('T')[0]);
        }
      });

      // Combiner les deux listes
      setBlockedDates([...new Set([...manuallyBlocked, ...reservationBlocked])]);
    } catch (error) {
      console.error('Erreur chargement dates bloquées:', error);
    }
  };

  const checkAvailability = async () => {
    if (!checkIn || !checkOut) return;

    setAvailabilityStatus('checking');
    
    try {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

      if (nights < property.min_nights || nights > property.max_nights) {
        setAvailabilityStatus('unavailable');
        return;
      }

      // Vérifier les dates bloquées manuellement
      const checkInDateObj = new Date(checkIn);
      const checkOutDateObj = new Date(checkOut);
      for (let d = new Date(checkInDateObj); d < checkOutDateObj; d.setDate(d.getDate() + 1)) {
        const dateString = d.toISOString().split('T')[0];
        if (blockedDates.includes(dateString)) {
          setAvailabilityStatus('unavailable');
          return;
        }
      }

      // Vérifier les conflits de réservation (sauf si c'est le propriétaire)
      if (!isOwner) {
        // Vérifier les chevauchements de dates : deux périodes se chevauchent si
        // check_in < new_check_out ET check_out > new_check_in
        // On récupère toutes les réservations et on filtre côté client pour plus de fiabilité
        const { data: allReservations, error: conflictError } = await supabase
          .from('reservations')
          .select('check_in, check_out')
          .eq('property_id', property.id)
          .in('status', ['confirmed', 'pending']);

        if (conflictError) {
          console.error('Erreur requête conflits:', conflictError);
          setAvailabilityStatus('unavailable');
          return;
        }

        // Vérifier les chevauchements côté client
        const hasConflict = allReservations?.some(reservation => {
          const resCheckIn = new Date(reservation.check_in);
          const resCheckOut = new Date(reservation.check_out);
          const newCheckIn = new Date(checkIn);
          const newCheckOut = new Date(checkOut);
          
          // Deux périodes se chevauchent si: start1 < end2 AND end1 > start2
          return resCheckIn < newCheckOut && resCheckOut > newCheckIn;
        });

        if (hasConflict) {
          setAvailabilityStatus('unavailable');
          return;
        }
      }

      setAvailabilityStatus('available');
    } catch (error) {
      console.error('Erreur vérification disponibilité:', error);
      setAvailabilityStatus('unavailable');
    }
  };

  const calculatePrice = () => {
    if (!checkIn || !checkOut) return null;

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    if (nights < property.min_nights || nights > property.max_nights) return null;

    let basePrice = property.price_per_night * nights;
    let discount = 0;

    if (nights >= 30 && property.long_stay_discount_30) {
      discount = (basePrice * property.long_stay_discount_30) / 100;
    } else if (nights >= 7 && property.long_stay_discount_7) {
      discount = (basePrice * property.long_stay_discount_7) / 100;
    }

    const subtotal = basePrice - discount;
    const cleaning = property.cleaning_fee || 0;
    const serviceFee = (subtotal * 0.12); // 12% de frais de service
    const total = subtotal + cleaning + serviceFee;

    return { nights, basePrice, discount, subtotal, cleaning, serviceFee, total };
  };

  const handleBooking = async () => {
    // Vérifier que l'utilisateur est connecté (compte obligatoire)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Vous devez créer un compte pour réserver. Veuillez vous connecter ou créer un compte.');
      navigate('/login?redirect=/property/' + property.id);
      return;
    }

    if (availabilityStatus === 'available') {
      setShowPayment(true);
    }
  };

  const handlePaymentSuccess = async (paymentData: {
    payment_method: string;
    payment_status: string;
    transaction_id?: string;
  }) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      const price = calculatePrice();
      if (!price) throw new Error('Calcul de prix invalide');

      // Créer la réservation avec statut 'pending' pour que l'hôte puisse la voir
      const { data: reservation, error } = await supabase
        .from('reservations')
        .insert({
          property_id: property.id,
          guest_id: user.id,
          check_in: checkIn,
          check_out: checkOut,
          adults: guests,
          children: 0,
          infants: 0,
          pets: 0,
          subtotal: price.subtotal,
          cleaning_fee: price.cleaning,
          service_fee: price.serviceFee,
          total_amount: price.total,
          status: 'pending', // Statut 'pending' pour que l'hôte puisse confirmer
          payment_method: paymentData.payment_method,
          payment_status: paymentData.payment_status,
          special_requests: ''
        })
        .select()
        .single();

      if (error) throw error;

      // Désactiver l'envoi d'emails pour l'instant
      // await sendBookingNotifications(reservation.id);

      if (onBookingSuccess) {
        onBookingSuccess(reservation.id);
      }

      alert('Réservation créée avec succès ! Elle est maintenant en attente de confirmation par l\'hôte.');
      setShowPayment(false);
      
      // Réinitialiser le formulaire
      setCheckIn('');
      setCheckOut('');
      setGuests(1);
      
      // Rediriger vers la page des réservations pour voir la nouvelle réservation
      navigate('/my-reservations');
    } catch (error: any) {
      console.error('Erreur création réservation:', error);
      alert('Erreur lors de la réservation: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const sendBookingNotifications = async (reservationId: string) => {
    // Cette fonction sera appelée pour envoyer les notifications
    // Email, WhatsApp, Messagerie Nzooimmo
    // À implémenter avec votre service de notifications
    console.log('Envoi notifications pour réservation:', reservationId);
  };

  const price = calculatePrice();
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      {isOwner && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Vous êtes le propriétaire de cette propriété.</strong> Vous pouvez faire une réservation pour tester ou bloquer des dates.
          </p>
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-2xl font-bold text-gray-900">
            ${property.price_per_night} <span className="text-base font-normal text-gray-600">/nuit</span>
          </p>
          {property.cleaning_fee > 0 && (
            <p className="text-sm text-gray-500 mt-1">+ ${property.cleaning_fee} de frais de ménage</p>
          )}
        </div>
        <div className="flex items-center space-x-1">
          <Shield className="w-5 h-5 text-green-600" />
          <span className="text-sm text-green-600 font-medium">Réservation sécurisée</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Arrivée
            </label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => {
                setCheckIn(e.target.value);
                if (!e.target.value || (checkOut && e.target.value >= checkOut)) {
                  setCheckOut('');
                  setAvailabilityStatus(null);
                }
              }}
              min={today}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Départ
            </label>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => {
                setCheckOut(e.target.value);
                if (!e.target.value) {
                  setAvailabilityStatus(null);
                }
              }}
              min={checkIn || today}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Voyageurs */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Users className="w-4 h-4 inline mr-1" />
            Voyageurs
          </label>
          <input
            type="number"
            min="1"
            max={property.max_guests}
            value={guests}
            onChange={(e) => setGuests(parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Statut de disponibilité */}
        {checkIn && checkOut && availabilityStatus !== null && (
          <div className={`p-4 rounded-lg ${
            availabilityStatus === 'available' ? 'bg-green-50 border border-green-200' :
            availabilityStatus === 'unavailable' ? 'bg-red-50 border border-red-200' :
            'bg-yellow-50 border border-yellow-200'
          }`}>
            {availabilityStatus === 'available' && (
              <div className="flex items-center space-x-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Disponible pour ces dates</span>
              </div>
            )}
            {availabilityStatus === 'unavailable' && (
              <div className="flex items-center space-x-2 text-red-700">
                <Clock className="w-5 h-5" />
                <span>Ces dates ne sont pas disponibles</span>
              </div>
            )}
            {availabilityStatus === 'checking' && (
              <div className="flex items-center space-x-2 text-yellow-700">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                <span>Vérification de la disponibilité...</span>
              </div>
            )}
          </div>
        )}

        {/* Calcul du prix */}
        {price && availabilityStatus === 'available' && (
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>${property.price_per_night} × {price.nights} nuits</span>
              <span>${price.basePrice.toFixed(2)}</span>
            </div>
            {price.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Remise</span>
                <span>-${price.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span>Frais de ménage</span>
              <span>${price.cleaning.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Frais de service (12%)</span>
              <span>${price.serviceFee.toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>${price.total.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Bouton de réservation */}
        <button
          onClick={handleBooking}
          disabled={!checkIn || !checkOut || availabilityStatus !== 'available' || loading}
          className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-semibold"
        >
          <CreditCard className="w-5 h-5" />
          <span>{loading ? 'Traitement...' : 'Réserver'}</span>
        </button>

        <p className="text-xs text-center text-gray-500">
          Vous ne serez pas débité tant que l'hôte n'aura pas confirmé votre demande
        </p>
      </div>

      {/* Modal de paiement */}
      {showPayment && price && (
        <PaymentModal
          amount={price.total}
          property={property}
          reservationData={{
            checkIn,
            checkOut,
            guests,
            nights: price.nights
          }}
          onPaymentSuccess={handlePaymentSuccess}
          onClose={() => setShowPayment(false)}
        />
      )}
    </div>
  );
};

export default RealTimeBooking;

