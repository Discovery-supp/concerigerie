import React from 'react';
import { Calendar, User, DollarSign, MapPin, CheckCircle, Clock, XCircle, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

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
  };
  check_in: string;
  check_out: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'pending_cancellation';
  payment_status: 'pending' | 'paid' | 'refunded';
  adults: number;
  children: number;
}

interface ReservationCardProps {
  reservation: Reservation;
  userType: 'owner' | 'traveler' | 'admin';
  onStatusChange?: (id: string, status: string) => void;
  onCancel?: (id: string) => void;
}

const ReservationCard: React.FC<ReservationCardProps> = ({ reservation, userType, onStatusChange, onCancel }) => {
  const navigate = useNavigate();

  const handleCardClick = (e: React.MouseEvent) => {
    // Ne pas naviguer si on clique sur un bouton ou un lien
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) {
      return;
    }
    navigate(`/property/${reservation.property_id}?from=dashboard`);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
      pending_cancellation: 'bg-orange-100 text-orange-800'
    };
    const icons = {
      pending: Clock,
      confirmed: CheckCircle,
      cancelled: XCircle,
      completed: CheckCircle,
      pending_cancellation: Clock
    };
    const Icon = icons[status as keyof typeof icons] || Clock;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.pending}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status === 'pending' && 'En attente'}
        {status === 'confirmed' && 'Confirmée'}
        {status === 'cancelled' && 'Annulée'}
        {status === 'completed' && 'Terminée'}
        {status === 'pending_cancellation' && 'Annulation demandée'}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Normaliser les images de la propriété
  const getPropertyImage = () => {
    if (!reservation.property?.images) return null;
    
    let images: string[] = [];
    if (Array.isArray(reservation.property.images)) {
      images = reservation.property.images;
    } else if (typeof reservation.property.images === 'string') {
      try {
        const parsed = JSON.parse(reservation.property.images);
        images = Array.isArray(parsed) ? parsed : [reservation.property.images];
      } catch {
        images = [reservation.property.images];
      }
    }
    
    return images.length > 0 ? images[0] : null;
  };

  const propertyImage = getPropertyImage();

  return (
    <div 
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="flex gap-4 mb-4">
        {propertyImage && (
          <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
            <img
              src={propertyImage}
              alt={reservation.property?.title || 'Propriété'}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg';
              }}
            />
          </div>
        )}
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 hover:text-primary transition-colors">
            {reservation.property?.title || 'Propriété'}
          </h3>
          <div className="flex items-center text-gray-600 mt-1">
            <MapPin className="w-4 h-4 mr-1" />
            <span className="text-sm">{reservation.property?.address || ''}</span>
          </div>
        </div>
        {getStatusBadge(reservation.status)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-start">
          <Calendar className="w-5 h-5 text-gray-400 mr-2 mt-0.5" />
          <div>
            <p className="text-sm text-gray-600">Arrivée</p>
            <p className="text-sm font-medium text-gray-900">{formatDate(reservation.check_in)}</p>
          </div>
        </div>
        <div className="flex items-start">
          <Calendar className="w-5 h-5 text-gray-400 mr-2 mt-0.5" />
          <div>
            <p className="text-sm text-gray-600">Départ</p>
            <p className="text-sm font-medium text-gray-900">{formatDate(reservation.check_out)}</p>
          </div>
        </div>
      </div>

      {userType === 'owner' && reservation.guest && (
        <div className="flex items-start mb-4">
          <User className="w-5 h-5 text-gray-400 mr-2 mt-0.5" />
          <div>
            <p className="text-sm text-gray-600">Invité</p>
            <p className="text-sm font-medium text-gray-900">
              {reservation.guest.first_name} {reservation.guest.last_name}
            </p>
            <p className="text-xs text-gray-500">{reservation.guest.email}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center">
          <DollarSign className="w-5 h-5 text-gray-400 mr-2" />
          <span className="text-lg font-bold text-gray-900">
            {Number(reservation.total_amount).toFixed(2)} €
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            {reservation.adults} adulte{reservation.adults > 1 ? 's' : ''}
            {reservation.children > 0 && `, ${reservation.children} enfant${reservation.children > 1 ? 's' : ''}`}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className={`text-xs px-2 py-1 rounded ${reservation.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
          {reservation.payment_status === 'paid' ? 'Payé' : reservation.payment_status === 'pending' ? 'En attente' : 'Remboursé'}
        </span>
        {onStatusChange && reservation.status === 'pending' && (
          <div className="flex space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(reservation.id, 'confirmed');
              }}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
            >
              Confirmer
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(reservation.id, 'cancelled');
              }}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
            >
              Refuser
            </button>
          </div>
        )}
        {onCancel && userType === 'admin' && reservation.status !== 'cancelled' && reservation.status !== 'completed' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onCancel) onCancel(reservation.id);
            }}
            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors flex items-center space-x-1"
            title="Annuler la réservation"
          >
            <X className="w-4 h-4" />
            <span>Annuler</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ReservationCard;

