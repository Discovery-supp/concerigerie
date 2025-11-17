import React, { useState } from 'react';
import ReservationCard from './ReservationCard';
import { Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';

interface Reservation {
  id: string;
  property_id: string;
  property?: {
    title: string;
    address: string;
    images?: string[];
  };
  guest?: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  check_in: string;
  check_out: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'pending_cancellation';
  payment_status: 'pending' | 'paid' | 'refunded';
  adults: number;
  children: number;
  special_requests?: string;
}

interface ReservationsListProps {
  reservations: Reservation[];
  userType: 'owner' | 'traveler' | 'admin';
  title?: string;
  showFilters?: boolean;
  onStatusChange?: (id: string, status: string) => void;
  onCancel?: (id: string) => void;
}

const ReservationsList: React.FC<ReservationsListProps> = ({
  reservations,
  userType,
  title = 'Réservations',
  showFilters = true,
  onStatusChange,
  onCancel
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'pending_cancellation'>('all');

  const filteredReservations = filter === 'all'
    ? reservations
    : reservations.filter(r => r.status === filter);

  const stats = {
    total: reservations.length,
    pending: reservations.filter(r => r.status === 'pending').length,
    confirmed: reservations.filter(r => r.status === 'confirmed').length,
    completed: reservations.filter(r => r.status === 'completed').length,
    cancelled: reservations.filter(r => r.status === 'cancelled').length,
    pending_cancellation: reservations.filter(r => r.status === 'pending_cancellation').length
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        {showFilters && (
          <div className="flex space-x-2">
            {[
              { value: 'all', label: 'Toutes', count: stats.total },
              { value: 'pending', label: 'En attente', count: stats.pending },
              { value: 'confirmed', label: 'Confirmées', count: stats.confirmed },
              { value: 'completed', label: 'Terminées', count: stats.completed },
              { value: 'pending_cancellation', label: 'Annulation demandée', count: stats.pending_cancellation },
              { value: 'cancelled', label: 'Annulées', count: stats.cancelled }
            ].map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f.value
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>
        )}
      </div>

      {filteredReservations.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucune réservation {filter !== 'all' ? `avec le statut "${filter}"` : ''}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReservations.map(reservation => (
            <ReservationCard
              key={reservation.id}
              reservation={reservation}
              userType={userType}
              onStatusChange={onStatusChange}
              onCancel={onCancel}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ReservationsList;

