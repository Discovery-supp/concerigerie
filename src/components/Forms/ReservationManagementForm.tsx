import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { attachReservationDetails } from '../../services/reservations';
import { Calendar, Users, DollarSign, Clock, CheckCircle, XCircle, AlertCircle, Edit, Trash2, MessageCircle, Plus } from 'lucide-react';

interface Reservation {
  id: string;
  property_id: string;
  guest_id: string;
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  infants: number;
  pets: number;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_method: string;
  payment_status: 'pending' | 'paid' | 'refunded';
  special_requests?: string;
  additional_services: ReservationAdditionalService[];
  created_at: string;
  updated_at: string;
  property?: any;
  guest?: any;
}

interface Property {
  id: string;
  title: string;
  address: string;
  price_per_night: number;
}

interface Guest {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

interface ReservationAdditionalService {
  id?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(value) || 0);

const createEmptyService = (): ReservationAdditionalService => ({
  id: `svc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
  name: '',
  quantity: 1,
  unitPrice: 0,
  totalPrice: 0
});

const normalizeServices = (services: any): ReservationAdditionalService[] => {
  if (!Array.isArray(services)) return [];
  return services.map((service, index) => {
    if (typeof service === 'string') {
      return {
        id: `svc-${index}`,
        name: service,
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0
      };
    }

    const quantity = Number(service.quantity) || 1;
    const unitPrice = Number(service.unitPrice ?? service.price) || 0;
    const totalPrice = Number(service.totalPrice) || Number((quantity * unitPrice).toFixed(2));

    return {
      id: service.id || `svc-${index}`,
      name: service.name || service.title || `Service ${index + 1}`,
      quantity,
      unitPrice,
      totalPrice
    };
  });
};

const calculateServiceTotal = (services: ReservationAdditionalService[]) =>
  services.reduce((sum, service) => sum + (Number(service.totalPrice) || 0), 0);

interface ReservationManagementFormProps {
  userType: 'owner' | 'admin' | 'traveler';
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ReservationManagementForm: React.FC<ReservationManagementFormProps> = ({
  userType,
  onSuccess,
  onCancel
}) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
    propertyId: ''
  });
  const [editedServices, setEditedServices] = useState<ReservationAdditionalService[]>([]);
  const [serviceSaving, setServiceSaving] = useState(false);
  const [serviceMessage, setServiceMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const canEditServices = userType === 'admin';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let reservationsQuery = supabase
        .from('reservations')
        .select('*');

      if (userType === 'owner') {
        // Charger les réservations des propriétés de l'utilisateur
        const { data: userProperties } = await supabase
          .from('properties')
          .select('id')
          .eq('owner_id', user.id);

        const propertyIds = userProperties?.map(p => p.id) || [];
        if (propertyIds.length > 0) {
          reservationsQuery = reservationsQuery.in('property_id', propertyIds);
        } else {
          // Si pas de propriétés, retourner un tableau vide
          setReservations([]);
          return;
        }
      } else if (userType === 'traveler') {
        // Charger les réservations de l'utilisateur
        reservationsQuery = reservationsQuery.eq('guest_id', user.id);
      }

      const { data: reservationsDataRaw, error } = await reservationsQuery;
      if (error) throw error;

      const reservationsData = await attachReservationDetails(reservationsDataRaw, {
        includeProperty: true,
        includeGuestProfile: true
      });

      const normalizedReservations = (reservationsData || []).map((reservation: any) => ({
        ...reservation,
        additional_services: normalizeServices(reservation.additional_services)
      }));

      setReservations(normalizedReservations);

      // Charger les propriétés pour les filtres
      if (userType === 'admin') {
        const { data: propertiesData } = await supabase
          .from('properties')
          .select('id, title, address, price_per_night');
        setProperties(propertiesData || []);
      }

    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const openReservationDetails = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setEditedServices(normalizeServices(reservation.additional_services));
    setServiceMessage(null);
  };

  const closeReservationDetails = () => {
    setSelectedReservation(null);
    setEditedServices([]);
    setServiceMessage(null);
  };

  const updateReservationStatus = async (reservationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', reservationId);

      if (error) throw error;

      setReservations(prev => 
        prev.map(r => 
          r.id === reservationId 
            ? { ...r, status: newStatus as any, updated_at: new Date().toISOString() }
            : r
        )
      );

      onSuccess?.();
    } catch (error) {
      console.error('Erreur mise à jour:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const updatePaymentStatus = async (reservationId: string, newPaymentStatus: string) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ 
          payment_status: newPaymentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', reservationId);

      if (error) throw error;

      setReservations(prev => 
        prev.map(r => 
          r.id === reservationId 
            ? { ...r, payment_status: newPaymentStatus as any, updated_at: new Date().toISOString() }
            : r
        )
      );

      onSuccess?.();
    } catch (error) {
      console.error('Erreur mise à jour paiement:', error);
      alert('Erreur lors de la mise à jour du paiement');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'refunded': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleServiceFieldChange = (
    index: number,
    field: keyof ReservationAdditionalService,
    value: string
  ) => {
    setEditedServices(prev => {
      const updated = [...prev];
      const service = { ...updated[index] };

      if (field === 'name') {
        service.name = value;
      } else if (field === 'quantity' || field === 'unitPrice') {
        const numericValue = Number(value);
        service[field] = Number.isFinite(numericValue) ? numericValue : 0;
        const qty = Number(service.quantity) || 0;
        const unit = Number(service.unitPrice) || 0;
        service.totalPrice = Number((qty * unit).toFixed(2));
      } else if (field === 'totalPrice') {
        const numericValue = Number(value);
        service.totalPrice = Number.isFinite(numericValue) ? numericValue : 0;
      }

      updated[index] = service;
      return updated;
    });
  };

  const handleAddService = () => {
    setEditedServices(prev => [...prev, createEmptyService()]);
  };

  const handleRemoveService = (index: number) => {
    setEditedServices(prev => prev.filter((_, i) => i !== index));
  };

  const resetServicesToOriginal = () => {
    if (!selectedReservation) return;
    setEditedServices(normalizeServices(selectedReservation.additional_services));
    setServiceMessage(null);
  };

  const handleSaveServices = async () => {
    if (!selectedReservation) return;
    setServiceSaving(true);
    setServiceMessage(null);

    try {
      const sanitizedServices = editedServices.map(service => ({
        id: service.id || `svc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: service.name || 'Service',
        quantity: Number(service.quantity) || 0,
        unitPrice: Number(service.unitPrice) || 0,
        totalPrice:
          Number(service.totalPrice) ||
          Number(((Number(service.quantity) || 0) * (Number(service.unitPrice) || 0)).toFixed(2))
      }));

      const originalTotal = calculateServiceTotal(selectedReservation.additional_services || []);
      const newTotal = calculateServiceTotal(sanitizedServices);
      const baseAmount = Number(selectedReservation.total_amount || 0) - originalTotal;
      const updatedTotalAmount = Math.max(0, Number((baseAmount + newTotal).toFixed(2)));

      const { error } = await supabase
        .from('reservations')
        .update({
          additional_services: sanitizedServices,
          total_amount: updatedTotalAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedReservation.id);

      if (error) throw error;

      setReservations(prev =>
        prev.map(reservation =>
          reservation.id === selectedReservation.id
            ? { ...reservation, additional_services: sanitizedServices, total_amount: updatedTotalAmount }
            : reservation
        )
      );

      const updatedReservation = {
        ...selectedReservation,
        additional_services: sanitizedServices,
        total_amount: updatedTotalAmount,
        updated_at: new Date().toISOString()
      };

      setSelectedReservation(updatedReservation);
      setEditedServices(sanitizedServices);
      setServiceMessage({ type: 'success', text: 'Services supplémentaires mis à jour.' });
      onSuccess?.();
    } catch (error: any) {
      console.error('Erreur mise à jour services:', error);
      setServiceMessage({
        type: 'error',
        text: error.message || 'Impossible de mettre à jour les services.'
      });
    } finally {
      setServiceSaving(false);
      setTimeout(() => setServiceMessage(null), 4000);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const filteredReservations = reservations.filter(reservation => {
    if (filters.status && reservation.status !== filters.status) return false;
    if (filters.propertyId && reservation.property_id !== filters.propertyId) return false;
    if (filters.dateFrom && new Date(reservation.check_in) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && new Date(reservation.check_out) > new Date(filters.dateTo)) return false;
    return true;
  });

  const getTotalRevenue = () => {
    return reservations
      .filter(r => r.status === 'confirmed' || r.status === 'completed')
      .reduce((sum, r) => sum + r.total_amount, 0);
  };

  const getTotalReservations = () => {
    return reservations.length;
  };

  const getPendingReservations = () => {
    return reservations.filter(r => r.status === 'pending').length;
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Gestion des réservations
        </h2>
        <p className="text-gray-600">
          Gérez et suivez toutes les réservations
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total réservations</p>
              <p className="text-2xl font-bold text-gray-900">{getTotalReservations()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">En attente</p>
              <p className="text-2xl font-bold text-gray-900">{getPendingReservations()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Revenus</p>
              <p className="text-2xl font-bold text-gray-900">€{getTotalRevenue().toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Taux d'occupation</p>
              <p className="text-2xl font-bold text-gray-900">--%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Filtres</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-blue-600 hover:text-blue-700"
          >
            {showFilters ? 'Masquer' : 'Afficher'} les filtres
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="confirmed">Confirmé</option>
                <option value="cancelled">Annulé</option>
                <option value="completed">Terminé</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de début
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de fin
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {userType === 'admin' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Propriété
                </label>
                <select
                  value={filters.propertyId}
                  onChange={(e) => setFilters(prev => ({ ...prev, propertyId: e.target.value }))}
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
          </div>
        )}
      </div>

      {/* Liste des réservations */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Réservations ({filteredReservations.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Chargement...</p>
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucune réservation trouvée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Réservation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paiement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReservations.map((reservation) => (
                  <tr key={reservation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          #{reservation.id.slice(-8)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {reservation.adults + reservation.children} invité(s)
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {reservation.guest_id}
                      </div>
                      <div className="text-sm text-gray-500">
                        {reservation.payment_method}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(reservation.check_in).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        au {new Date(reservation.check_out).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        €{reservation.total_amount.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(reservation.status)}`}>
                        {getStatusIcon(reservation.status)}
                        <span className="ml-1">{reservation.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(reservation.payment_status)}`}>
                        {reservation.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {reservation.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateReservationStatus(reservation.id, 'confirmed')}
                              className="text-green-600 hover:text-green-900"
                              title="Confirmer"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => updateReservationStatus(reservation.id, 'cancelled')}
                              className="text-red-600 hover:text-red-900"
                              title="Annuler"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {reservation.payment_status === 'pending' && (
                          <button
                            onClick={() => updatePaymentStatus(reservation.id, 'paid')}
                            className="text-blue-600 hover:text-blue-900"
                            title="Marquer comme payé"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => openReservationDetails(reservation)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Voir détails"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Détails de la réservation */}
      {selectedReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Détails de la réservation
                </h3>
                <button
                  onClick={closeReservationDetails}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ID Réservation</label>
                    <p className="text-sm text-gray-900">#{selectedReservation.id.slice(-8)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Statut</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedReservation.status)}`}>
                      {selectedReservation.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Arrivée</label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedReservation.check_in).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Départ</label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedReservation.check_out).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Invités</label>
                  <p className="text-sm text-gray-900">
                    {selectedReservation.adults} adultes, {selectedReservation.children} enfants, {selectedReservation.infants} bébés
                    {selectedReservation.pets > 0 && `, ${selectedReservation.pets} animal(aux)`}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Montant total</label>
                  <p className="text-lg font-semibold text-gray-900">€{selectedReservation.total_amount.toFixed(2)}</p>
                </div>

                {selectedReservation.special_requests && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Demandes spéciales</label>
                    <p className="text-sm text-gray-900">{selectedReservation.special_requests}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Services supplémentaires</label>
                  {canEditServices ? (
                    <div className="space-y-3">
                      {serviceMessage && (
                        <div
                          className={`px-3 py-2 rounded-lg text-sm ${
                            serviceMessage.type === 'success'
                              ? 'bg-green-50 text-green-700 border border-green-100'
                              : 'bg-red-50 text-red-700 border border-red-100'
                          }`}
                        >
                          {serviceMessage.text}
                        </div>
                      )}
                      {editedServices.length === 0 && (
                        <p className="text-sm text-gray-500">Aucun service ajouté pour l’instant.</p>
                      )}
                      {editedServices.map((service, index) => (
                        <div
                          key={service.id || index}
                          className="grid grid-cols-1 md:grid-cols-6 gap-3 bg-gray-50 p-3 rounded-lg"
                        >
                          <div className="md:col-span-2">
                            <label className="text-xs text-gray-500 uppercase">Nom</label>
                            <input
                              type="text"
                              value={service.name}
                              onChange={(e) => handleServiceFieldChange(index, 'name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                              placeholder="Service (ex: Ménage)"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 uppercase">Quantité</label>
                            <input
                              type="number"
                              min="0"
                              value={service.quantity}
                              onChange={(e) => handleServiceFieldChange(index, 'quantity', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 uppercase">Prix unitaire</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={service.unitPrice}
                              onChange={(e) => handleServiceFieldChange(index, 'unitPrice', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 uppercase">Total</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={service.totalPrice}
                              onChange={(e) => handleServiceFieldChange(index, 'totalPrice', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                            />
                          </div>
                          <div className="flex items-end justify-end">
                            <button
                              type="button"
                              onClick={() => handleRemoveService(index)}
                              className="px-2 py-2 text-red-600 hover:text-red-800 rounded-lg border border-red-100 hover:border-red-300 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="text-sm text-gray-600">
                          Total services&nbsp;: <strong>{formatCurrency(calculateServiceTotal(editedServices))}</strong>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={handleAddService}
                            className="px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Ajouter un service
                          </button>
                          <button
                            type="button"
                            onClick={resetServicesToOriginal}
                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                          >
                            Réinitialiser
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveServices}
                            disabled={serviceSaving}
                            className="px-3 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-light disabled:bg-gray-400 flex items-center gap-2"
                          >
                            {serviceSaving ? 'Enregistrement...' : 'Enregistrer'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selectedReservation.additional_services.length === 0 ? (
                        <span className="text-sm text-gray-500">Aucun service supplémentaire</span>
                      ) : (
                        selectedReservation.additional_services.map((service, index) => (
                          <span key={service.id || index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {service.name} · {service.quantity} × {formatCurrency(service.unitPrice)} ={' '}
                            <strong>{formatCurrency(service.totalPrice)}</strong>
                          </span>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={closeReservationDetails}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Fermer
                </button>
                {selectedReservation.status === 'pending' && (
                  <button
                    onClick={() => {
                      updateReservationStatus(selectedReservation.id, 'confirmed');
                      closeReservationDetails();
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Confirmer
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationManagementForm;
