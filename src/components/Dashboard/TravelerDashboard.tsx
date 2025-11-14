import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import StatCard from './StatCard';
import QuickActionCard from './QuickActionCard';
import ReservationsList from './ReservationsList';
import MessagingSystem from '../Forms/MessagingSystem';
import ReviewsForm from '../Forms/ReviewsForm';
import { Calendar, Home, Search, MessageCircle, Gift, HelpCircle, Star, Settings } from 'lucide-react';

interface TravelerDashboardProps {
  userId: string;
}

const TravelerDashboard: React.FC<TravelerDashboardProps> = ({ userId }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'current' | 'history' | 'search' | 'messages' | 'offers' | 'reviews'>('overview');
  const [currentReservations, setCurrentReservations] = useState<any[]>([]);
  const [pastReservations, setPastReservations] = useState<any[]>([]);
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
      const today = new Date().toISOString().split('T')[0];

      // Réservations actuelles (check-out dans le futur) - inclure tous les statuts sauf cancelled
      const { data: currentData, error: currentError } = await supabase
        .from('reservations')
        .select(`
          *,
          property:properties(id, title, address, images)
        `)
        .eq('guest_id', userId)
        .gte('check_out', today)
        .neq('status', 'cancelled')  // Exclure seulement les annulées
        .order('created_at', { ascending: false });

      if (currentError) {
        console.error('Erreur chargement réservations actuelles:', currentError);
      }

      // Historique (check-out dans le passé) - inclure toutes les réservations
      const { data: pastData, error: pastError } = await supabase
        .from('reservations')
        .select(`
          *,
          property:properties(id, title, address, images)
        `)
        .eq('guest_id', userId)
        .lt('check_out', today)
        .order('check_out', { ascending: false });

      if (pastError) {
        console.error('Erreur chargement historique:', pastError);
      }

      setCurrentReservations(currentData || []);
      setPastReservations(pastData || []);

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
    return <div className="text-center py-12">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Navigation par onglets */}
      <div className="bg-white rounded-xl shadow-md p-1">
        <div className="flex space-x-1 overflow-x-auto">
          {[
            { id: 'overview', label: 'Vue d\'ensemble', icon: Home },
            { id: 'current', label: 'Réservations', icon: Calendar },
            { id: 'history', label: 'Historique', icon: Calendar },
            { id: 'search', label: 'Recherche', icon: Search },
            { id: 'messages', label: 'Messages', icon: MessageCircle },
            { id: 'reviews', label: 'Avis', icon: Star },
            { id: 'offers', label: 'Offres', icon: Gift }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Vue d'ensemble */}
      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatCard
              icon={<Calendar className="w-8 h-8 text-blue-600" />}
              title="Réservations actuelles"
              value={currentReservations.length}
              bgColor="bg-blue-50"
            />
            <StatCard
              icon={<Home className="w-8 h-8 text-green-600" />}
              title="Séjours passés"
              value={pastReservations.length}
              bgColor="bg-green-50"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <QuickActionCard
              title="Mes réservations"
              description="Voir toutes mes réservations"
              icon={<Calendar className="w-6 h-6" />}
              onClick={() => setActiveTab('current')}
              color="blue"
            />
            <QuickActionCard
              title="Rechercher un logement"
              description="Trouver votre prochain séjour"
              icon={<Search className="w-6 h-6" />}
              onClick={() => navigate('/properties?from=dashboard')}
              color="green"
            />
            <QuickActionCard
              title="Support client"
              description="Besoin d'aide ?"
              icon={<HelpCircle className="w-6 h-6" />}
              onClick={() => navigate('/consultation')}
              color="orange"
            />
            <QuickActionCard
              title="Offres spéciales"
              description="Voir les promotions"
              icon={<Gift className="w-6 h-6" />}
              onClick={() => setActiveTab('offers')}
              color="purple"
            />
            <QuickActionCard
              title="Paramètres"
              description="Gérer mon compte"
              icon={<Settings className="w-6 h-6" />}
              onClick={() => navigate('/settings')}
              color="gray"
            />
          </div>
        </>
      )}

      {/* Réservations actuelles */}
      {activeTab === 'current' && (
        <ReservationsList
          reservations={currentReservations}
          userType="traveler"
          title="Réservations actuelles"
        />
      )}

      {/* Historique */}
      {activeTab === 'history' && (
        <ReservationsList
          reservations={pastReservations}
          userType="traveler"
          title="Historique des séjours"
        />
      )}

      {/* Recherche */}
      {activeTab === 'search' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Rechercher une propriété</h3>
          <div className="text-center py-8">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Utilisez notre moteur de recherche avancé</p>
            <button
              onClick={() => navigate('/properties?from=dashboard')}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors"
            >
              Voir toutes les propriétés
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      {activeTab === 'messages' && (
        <MessagingSystem userType="traveler" />
      )}

      {/* Avis */}
      {activeTab === 'reviews' && (
        <ReviewsForm userType="traveler" />
      )}

      {/* Offres spéciales */}
      {activeTab === 'offers' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Offres Spéciales</h3>
          <div className="text-center py-12">
            <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucune offre spéciale disponible pour le moment</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TravelerDashboard;

