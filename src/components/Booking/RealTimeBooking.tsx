import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, Users, CreditCard, Shield, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import PaymentModal from './PaymentModal';
import { useToast } from '../../contexts/ToastContext';
import { messages } from '../../utils/messages';

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

interface GlobalService {
  id: string;
  name: string;
  unit_price: number;
  billing_type: string;
  is_active: boolean;
}

interface AdditionalService {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

const RealTimeBooking: React.FC<RealTimeBookingProps> = ({ property, onBookingSuccess }) => {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<'available' | 'unavailable' | 'checking' | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [availableServices, setAvailableServices] = useState<AdditionalService[]>([]);
  const [additionalServices, setAdditionalServices] = useState<AdditionalService[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [specialOffers, setSpecialOffers] = useState<
    { start_date: string; end_date: string; special_price_per_night: number }[]
  >([]);

  // Charger les services supplémentaires globaux définis par l'admin
  useEffect(() => {
    const loadGlobalServices = async () => {
      try {
        const { data, error } = await supabase
          .from('global_services')
          .select('id, name, unit_price, billing_type, is_active')
          .eq('is_active', true);

        if (error) {
          console.error('Erreur chargement services globaux:', error);
          return;
        }

        if (data && Array.isArray(data)) {
          // On ne garde pour l'instant que les services facturés "par jour"
          const mapped: AdditionalService[] = (data as GlobalService[])
            .filter((svc) => svc.billing_type === 'per_day')
            .map((svc) => ({
              id: svc.id,
              name: svc.name,
              unitPrice: Number(svc.unit_price) || 0,
              quantity: 0,
              totalPrice: 0,
            }));

          setAvailableServices(mapped);
        }
      } catch (err) {
        console.error('Erreur inattendue chargement services globaux:', err);
      }
    };

    loadGlobalServices();
  }, []);

  // Charger les offres spéciales pour la propriété
  useEffect(() => {
    const loadSpecialOffers = async () => {
      try {
        const { data, error } = await supabase
          .from('special_offers')
          .select('start_date, end_date, special_price_per_night, is_active')
          .eq('property_id', property.id)
          .eq('is_active', true);

        if (error) {
          console.error('Erreur chargement offres spéciales:', error);
          return;
        }

        const mapped =
          data?.map((o) => ({
            start_date: o.start_date,
            end_date: o.end_date,
            special_price_per_night: Number(o.special_price_per_night) || 0,
          })) || [];

        console.log('Offres spéciales chargées pour propriété', property.id, ':', mapped);
        setSpecialOffers(mapped);
      } catch (err) {
        console.error('Erreur inattendue chargement offres spéciales:', err);
      }
    };

    loadSpecialOffers();
  }, [property.id]);

  useEffect(() => {
    checkIfOwner();
    loadBlockedDates();
    checkAuthentication();
    
    const authListener = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
    });
    
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
      authListener.data.subscription.unsubscribe();
    };
  }, [property.id]);

  // Recalculer les prix des services supplémentaires quand les dates changent
  useEffect(() => {
    if (checkIn && checkOut && additionalServices.length > 0) {
      const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
      setAdditionalServices(prev => prev.map(s => ({
        ...s,
        totalPrice: s.unitPrice * nights
      })));
    }
  }, [checkIn, checkOut]);

  const checkAuthentication = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
  };

  const handleServiceQuantityChange = (serviceId: string, quantity: number) => {
    const service = availableServices.find(s => s.id === serviceId);
    if (!service) return;

    // Calculer le nombre de nuits pour le calcul du prix par jour
    const nights = checkIn && checkOut 
      ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
      : 1;

    setAdditionalServices(prev => {
      const existing = prev.find(s => s.id === serviceId);
      if (quantity === 0) {
        return prev.filter(s => s.id !== serviceId);
      }
      if (existing) {
        // Prix par jour multiplié par le nombre de nuits
        return prev.map(s => 
          s.id === serviceId 
            ? { ...s, quantity, totalPrice: service.unitPrice * nights }
            : s
        );
      }
      return [...prev, {
        id: serviceId,
        name: service.name,
        unitPrice: service.unitPrice, // Prix par jour
        quantity,
        totalPrice: service.unitPrice * nights // Prix par jour * nombre de nuits
      }];
    });
  };

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

    // Calcul du prix nuit par nuit en tenant compte des offres spéciales
    let basePrice = 0;
    let hasSpecialOffer = false;
    const currentDate = new Date(checkInDate);
    
    console.log('Calcul prix pour dates:', checkIn, '→', checkOut, '(', nights, 'nuits)');
    console.log('Offres spéciales disponibles:', specialOffers);
    
    for (let i = 0; i < nights; i++) {
      const dateString = currentDate.toISOString().split('T')[0];
      const offer = specialOffers.find((o) => {
        // Inclure la nuit si elle est comprise dans [start_date, end_date]
        // Note: end_date est inclusif (la dernière nuit de l'offre)
        // Pour une réservation du 02/12 au 04/12, on dort les nuits du 02/12 et 03/12
        // Donc on utilise < end_date pour exclure la nuit de départ
        return dateString >= o.start_date && dateString < o.end_date;
      });
      
      if (offer) {
        hasSpecialOffer = true;
        console.log(`Nuit ${i + 1} (${dateString}): Prix spécial ${offer.special_price_per_night}€`);
      } else {
        console.log(`Nuit ${i + 1} (${dateString}): Prix normal ${property.price_per_night}€`);
      }
      
      const nightlyPrice = offer ? offer.special_price_per_night : property.price_per_night;
      basePrice += nightlyPrice;
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    console.log('Prix total calculé:', basePrice, '€ (hasSpecialOffer:', hasSpecialOffer, ')');
    let discount = 0;

    if (nights >= 30 && property.long_stay_discount_30) {
      discount = (basePrice * property.long_stay_discount_30) / 100;
    } else if (nights >= 7 && property.long_stay_discount_7) {
      discount = (basePrice * property.long_stay_discount_7) / 100;
    }

    const subtotal = basePrice - discount;
    const cleaning = property.cleaning_fee || 0;
    
    // Recalculer les services supplémentaires avec le nombre de nuits actuel
    // Les services supplémentaires sont maintenant au prix par jour
    const additionalServicesTotal = additionalServices.reduce((sum, s) => {
      // Le totalPrice devrait déjà être calculé avec le nombre de nuits, mais on le recalcule pour être sûr
      return sum + (s.unitPrice * nights);
    }, 0);
    
    const serviceFee = (subtotal + cleaning + additionalServicesTotal) * 0.12; // 12% de frais de service
    const total = subtotal + cleaning + additionalServicesTotal + serviceFee;

    const effectiveNightlyRate = nights > 0 ? basePrice / nights : property.price_per_night;

    return {
      nights,
      basePrice,
      discount,
      subtotal,
      cleaning,
      additionalServicesTotal,
      serviceFee,
      total,
      hasSpecialOffer,
      effectiveNightlyRate,
    };
  };

  const handleBooking = async () => {
    // Vérifier que l'utilisateur est connecté (compte obligatoire)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showError('Vous devez créer un compte voyageur pour effectuer une réservation');
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
      const { data: createdReservation, error } = await supabase
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
          special_requests: '',
          additional_services: additionalServices.length > 0 
            ? additionalServices.map(s => ({
                id: s.id,
                name: s.name,
                unitPrice: s.unitPrice,
                quantity: s.quantity,
                totalPrice: s.totalPrice
              }))
            : []
        })
        .select()
        .single();

      if (error) throw error;

      let reservation = createdReservation;

      if (paymentData.payment_status === 'paid' && paymentData.payment_method !== 'cash') {
        const { data: confirmedReservation, error: confirmError } = await supabase
          .from('reservations')
          .update({
            status: 'confirmed',
            payment_status: 'paid',
            updated_at: new Date().toISOString(),
          })
          .eq('id', createdReservation.id)
          .select()
          .single();

        if (confirmError) throw confirmError;
        reservation = confirmedReservation;
      }

      // Notifications: informer le propriétaire et les administrateurs
      try {
        // Récupérer propriétaire de la propriété
        const { data: propOwner } = await supabase
          .from('properties')
          .select('owner_id, title')
          .eq('id', property.id)
          .single();

        const notificationsToInsert: any[] = [];

        // Notification au propriétaire (host)
        if (propOwner?.owner_id) {
          notificationsToInsert.push({
            user_id: propOwner.owner_id,
            type: 'new_reservation',
            title: 'Nouvelle réservation',
            message: `Vous avez une nouvelle réservation pour ${propOwner.title || 'votre propriété'}.`,
            data: {
              reservation_id: reservation.id,
              property_id: property.id,
              check_in: checkIn,
              check_out: checkOut
            },
            is_read: false
          });
        }

        // Notifications aux admins
        const { data: admins } = await supabase
          .from('user_profiles')
          .select('id')
          .in('user_type', ['admin', 'super_admin']);

        if (admins && admins.length > 0) {
          admins.forEach(a => notificationsToInsert.push({
            user_id: a.id,
            type: 'new_reservation',
            title: 'Nouvelle réservation',
            message: `Une nouvelle réservation a été créée pour la propriété ${propOwner?.title || property.id}.`,
            data: {
              reservation_id: reservation.id,
              property_id: property.id,
              guest_id: user.id
            },
            is_read: false
          }));
        }

        if (notificationsToInsert.length > 0) {
          await supabase.from('notifications').insert(notificationsToInsert);
        }
      } catch (notifError) {
        console.warn('Notification non critique:', notifError);
      }

      // Désactiver l'envoi d'emails pour l'instant
      // await sendBookingNotifications(reservation.id);

      if (onBookingSuccess) {
        onBookingSuccess(reservation.id);
      }

      const autoConfirmed = reservation.status === 'confirmed';
      showSuccess(
        autoConfirmed
          ? messages.success.reservationConfirmed
          : messages.success.reservationCreated
      );
      setShowPayment(false);
      
      // Réinitialiser le formulaire
      setCheckIn('');
      setCheckOut('');
      setGuests(1);
      
      // Rediriger vers la page des réservations pour voir la nouvelle réservation
      setTimeout(() => {
        navigate('/my-reservations');
      }, 1500);
    } catch (error: any) {
      console.error('Erreur création réservation:', error);
      showError(messages.error.reservationFailed + (error.message ? ` ${error.message}` : ''));
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
      {!isAuthenticated && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold text-yellow-900 mb-1">
                Compte requis pour réserver
              </h4>
              <p className="text-sm text-yellow-800 mb-3">
                Pour effectuer une réservation, vous devez créer un compte voyageur. C'est rapide et gratuit !
              </p>
              <Link
                to={`/traveler-register?redirect=${encodeURIComponent(`/property/${property.id}`)}`}
                className="inline-block px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors text-sm font-semibold"
              >
                Créer un compte voyageur
              </Link>
            </div>
          </div>
        </div>
      )}
      {isOwner && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Vous êtes le propriétaire de cette propriété.</strong> Vous pouvez faire une réservation pour tester ou bloquer des dates.
          </p>
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <div>
          {price?.hasSpecialOffer ? (
            <>
              <p className="text-sm font-semibold text-amber-600 uppercase tracking-wide mb-1">
                Offre spéciale sur vos dates
              </p>
              <div className="flex items-baseline space-x-2">
                <p className="text-2xl font-bold text-amber-700">
                  {price.effectiveNightlyRate.toFixed(2)}$
                  <span className="text-base font-normal text-gray-600"> /nuit</span>
                </p>
                <span className="text-sm text-gray-400 line-through">
                  {property.price_per_night}$
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                  -{Math.round(((property.price_per_night - price.effectiveNightlyRate) / property.price_per_night) * 100)}%
                </span>
              </div>
            </>
          ) : (
            <p className="text-2xl font-bold text-gray-900">
              {property.price_per_night}$
              <span className="text-base font-normal text-gray-600"> /nuit</span>
            </p>
          )}
          {property.cleaning_fee > 0 && (
            <p className="text-sm text-gray-500 mt-1">+ {property.cleaning_fee}$ de frais de ménage</p>
          )}
        </div>
        <div className="flex flex-col items-end space-y-1">
          {price?.hasSpecialOffer && (
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold">
              🌟 Tarif promotionnel actif
            </span>
          )}
          <div className="flex items-center space-x-1">
            <Shield className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-600 font-medium">Réservation sécurisée</span>
          </div>
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

        {/* Services supplémentaires */}
        {checkIn && checkOut && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Services supplémentaires (optionnel)
            </label>
            <div className="space-y-3">
              {availableServices.map(service => {
                const selectedService = additionalServices.find(s => s.id === service.id);
                const quantity = selectedService?.quantity || 0;
                return (
                  <div key={service.id} className="flex items-center justify-between p-3 border border-gray-300 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{service.name}</div>
                      <div className="text-sm text-gray-600">
                        Prix par jour: ${service.unitPrice.toFixed(2)}
                        {price && price.nights > 0 && (
                          <span className="text-gray-500"> × {price.nights} nuit{price.nights > 1 ? 's' : ''}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        onClick={() => handleServiceQuantityChange(service.id, Math.max(0, quantity - 1))}
                        className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50"
                        disabled={quantity === 0}
                      >
                        -
                      </button>
                      <span className="w-12 text-center font-medium">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => handleServiceQuantityChange(service.id, quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        +
                      </button>
                      {quantity > 0 && price && (
                        <div className="ml-4 text-right">
                          <div className="text-sm font-semibold text-gray-900">
                            ${(service.unitPrice * price.nights).toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">Total ({price.nights} nuit{price.nights > 1 ? 's' : ''})</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
              <span>
                {price.hasSpecialOffer ? (
                  <>
                    {price.effectiveNightlyRate.toFixed(2)} € × {price.nights} nuits
                    <span className="ml-2 text-xs text-green-600 font-semibold">
                      (tarif spécial appliqué)
                    </span>
                  </>
                ) : (
                  <>
                    ${property.price_per_night} × {price.nights} nuits
                  </>
                )}
              </span>
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
            {price.additionalServicesTotal > 0 && (
              <div className="flex justify-between text-sm">
                <span>Services supplémentaires</span>
                <span>${price.additionalServicesTotal.toFixed(2)}</span>
              </div>
            )}
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
        {!isAuthenticated ? (
          <Link
            to={`/traveler-register?redirect=${encodeURIComponent(`/property/${property.id}`)}`}
            className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors flex items-center justify-center space-x-2 font-semibold"
          >
            <CreditCard className="w-5 h-5" />
            <span>Créer un compte pour réserver</span>
          </Link>
        ) : (
          <button
            onClick={handleBooking}
            disabled={!checkIn || !checkOut || availabilityStatus !== 'available' || loading}
            className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-semibold"
          >
            <CreditCard className="w-5 h-5" />
            <span>{loading ? 'Traitement...' : 'Réserver'}</span>
          </button>
        )}

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

