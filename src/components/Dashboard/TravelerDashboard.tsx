import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import reservationsService from '../../services/reservations';
import ReservationsList from './ReservationsList';
import { Calendar, ExternalLink } from 'lucide-react';

interface TravelerDashboardProps {
  userId: string;
}

const TravelerDashboard: React.FC<TravelerDashboardProps> = ({ userId }) => {
  const navigate = useNavigate();
  const [allReservations, setAllReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let pollId: number | undefined;
    
    const setupData = async () => {
      cleanup = await loadData();
      // Fallback polling toutes les 30s si Realtime indisponible
      pollId = window.setInterval(() => {
        loadData();
      }, 30000) as unknown as number;
    };
    
    setupData();
    
    return () => {
      if (cleanup) cleanup();
      if (pollId) window.clearInterval(pollId);
    };
  }, [userId]);

  const loadData = async (): Promise<(() => void) | undefined> => {
    try {
      // Charger toutes les réservations (historique complet) via le service
      const reservationsData = await reservationsService.getUserReservations(userId);
      
      console.log('[TravelerDashboard] Réservations chargées:', reservationsData?.length || 0);
      setAllReservations(Array.isArray(reservationsData) ? reservationsData : []);

      // S'abonner aux changements de réservations en temps réel
      const reservationChannel = supabase
        .channel(`traveler-reservations-${userId}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'reservations',
            filter: `guest_id=eq.${userId}`
          },
          (payload) => {
            console.log('Changement de réservation:', payload);
            loadData(); // Recharger les réservations
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(reservationChannel);
      };
    } catch (error) {
      console.error('Erreur chargement données:', error);
      return undefined;
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Chargement de l'historique des réservations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Calendar className="w-6 h-6 mr-2 text-primary" />
            Historique de mes réservations
          </h2>
          <p className="text-gray-600 mt-1">
            Consultez toutes vos réservations passées et à venir
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/my-reservations"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Voir toutes mes réservations
          </Link>
          <button
            onClick={() => navigate('/properties?from=dashboard')}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors"
          >
            Nouvelle réservation
          </button>
        </div>
      </div>

      <ReservationsList
        reservations={allReservations}
        userType="traveler"
        title="Toutes mes réservations"
      />
    </div>
  );
};

export default TravelerDashboard;

