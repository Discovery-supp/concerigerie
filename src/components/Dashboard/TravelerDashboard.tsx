import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import reservationsService from '../../services/reservations';
import ReservationsList from './ReservationsList';
import StatCard from './StatCard';
import ReviewsForm from '../Forms/ReviewsForm';
import MessagingSystem from '../Forms/MessagingSystem';
import { 
  Calendar, 
  ExternalLink, 
  Home, 
  Star, 
  MessageCircle, 
  Settings, 
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';

interface TravelerDashboardProps {
  userId: string;
}

const TravelerDashboard: React.FC<TravelerDashboardProps> = ({ userId }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'reservations' | 'reviews' | 'messages' | 'settings'>('overview');
  const [allReservations, setAllReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReservations: 0,
    upcomingReservations: 0,
    completedReservations: 0,
    totalSpent: 0,
    averageRating: 0,
    totalReviews: 0
  });

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    
    const setupData = async () => {
      // Chargement initial uniquement
      cleanup = await loadData(true);
    };
    
    setupData();
    
    return () => {
      if (cleanup) cleanup();
    };
  }, [userId]);

  const loadData = async (showLoading: boolean = false): Promise<(() => void) | undefined> => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      
      // Charger toutes les réservations (historique complet) via le service
      const reservationsData = await reservationsService.getUserReservations(userId);
      
      console.log('[TravelerDashboard] Réservations chargées:', reservationsData?.length || 0);
      const safeReservations = Array.isArray(reservationsData) ? reservationsData : [];
      setAllReservations(safeReservations);

      // Calculer les statistiques
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const upcoming = safeReservations.filter((r: any) => {
        const checkIn = new Date(r.check_in);
        checkIn.setHours(0, 0, 0, 0);
        return checkIn >= today && (r.status === 'confirmed' || r.status === 'pending');
      });

      const completed = safeReservations.filter((r: any) => 
        r.status === 'completed' || (new Date(r.check_out) < today && r.status === 'confirmed')
      );

      const totalSpent = safeReservations
        .filter((r: any) => r.status === 'completed' || r.status === 'confirmed')
        .reduce((sum: number, r: any) => sum + Number(r.total_amount || 0), 0);

      // Charger les avis pour calculer la note moyenne
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('rating')
        .eq('guest_id', userId);

      const reviews = reviewsData || [];
      const averageRating = reviews.length > 0
        ? reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviews.length
        : 0;

      setStats({
        totalReservations: safeReservations.length,
        upcomingReservations: upcoming.length,
        completedReservations: completed.length,
        totalSpent,
        averageRating,
        totalReviews: reviews.length
      });

      // Pas d'abonnement temps réel - actualisation manuelle uniquement
      // L'utilisateur peut cliquer sur le bouton "Rafraîchir" pour mettre à jour les données
    } catch (error) {
      console.error('Erreur chargement données:', error);
      return undefined;
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Chargement de votre tableau de bord...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord Voyageur</h1>
          <p className="text-gray-600 mt-1">Gérez vos réservations et vos voyages</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={async () => {
              console.log('[TravelerDashboard] Rafraîchissement manuel...');
              await loadData(true);
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
            title="Rafraîchir les données"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Rafraîchir</span>
          </button>
          <button
            onClick={() => navigate('/properties')}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors"
          >
            Nouvelle réservation
          </button>
        </div>
      </div>

      {/* Navigation par onglets */}
      <div className="bg-white rounded-xl shadow-md p-1">
        <div className="flex space-x-1 overflow-x-auto">
          {[
            { id: 'overview', label: 'Vue d\'ensemble', icon: Home },
            { id: 'reservations', label: 'Réservations', icon: Calendar },
            { id: 'reviews', label: 'Avis', icon: Star },
            { id: 'messages', label: 'Messages', icon: MessageCircle },
            { id: 'settings', label: 'Paramètres', icon: Settings, isLink: true, link: '/settings' }
          ].map(tab => {
            const Icon = tab.icon;
            if ((tab as any).isLink && (tab as any).link) {
              return (
                <Link
                  key={tab.id}
                  to={(tab as any).link}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap text-gray-600 hover:bg-gray-100"
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </Link>
              );
            }
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

      {/* Contenu des onglets */}
      
      {/* Vue d'ensemble */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Statistiques principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={<Calendar className="w-8 h-8 text-blue-600" />}
              title="Réservations totales"
              value={stats.totalReservations}
              subtitle={`${stats.upcomingReservations} à venir`}
              bgColor="bg-blue-50"
            />
            <StatCard
              icon={<CheckCircle className="w-8 h-8 text-green-600" />}
              title="Séjours terminés"
              value={stats.completedReservations}
              subtitle="Voyages complétés"
              bgColor="bg-green-50"
            />
            <StatCard
              icon={<DollarSign className="w-8 h-8 text-purple-600" />}
              title="Total dépensé"
              value={`$${stats.totalSpent.toFixed(2)}`}
              subtitle="Tous vos voyages"
              bgColor="bg-purple-50"
            />
            <StatCard
              icon={<Star className="w-8 h-8 text-yellow-600" />}
              title="Note moyenne"
              value={stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'N/A'}
              subtitle={`${stats.totalReviews} avis donnés`}
              bgColor="bg-yellow-50"
            />
          </div>

          {/* Réservations à venir */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Réservations à venir</h3>
              <button
                onClick={() => setActiveTab('reservations')}
                className="text-sm text-primary hover:text-primary-light"
              >
                Voir toutes
              </button>
            </div>
            {allReservations.filter((r: any) => {
              const checkIn = new Date(r.check_in);
              checkIn.setHours(0, 0, 0, 0);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return checkIn >= today && (r.status === 'confirmed' || r.status === 'pending');
            }).length > 0 ? (
              <div className="space-y-4">
                {allReservations
                  .filter((r: any) => {
                    const checkIn = new Date(r.check_in);
                    checkIn.setHours(0, 0, 0, 0);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return checkIn >= today && (r.status === 'confirmed' || r.status === 'pending');
                  })
                  .slice(0, 3)
                  .map((reservation: any) => (
                    <div key={reservation.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {reservation.property?.title || 'Propriété'}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {reservation.property?.address || 'Adresse non disponible'}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {new Date(reservation.check_in).toLocaleDateString('fr-FR')} - {new Date(reservation.check_out).toLocaleDateString('fr-FR')}
                            </span>
                            <span className="flex items-center">
                              <DollarSign className="w-4 h-4 mr-1" />
                              ${reservation.total_amount?.toFixed(2) || '0.00'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            reservation.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            reservation.status === 'pending_cancellation' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {reservation.status === 'confirmed' ? 'Confirmée' :
                             reservation.status === 'pending' ? 'En attente' :
                             reservation.status === 'pending_cancellation' ? 'Annulation demandée' :
                             reservation.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Aucune réservation à venir</p>
                <button
                  onClick={() => navigate('/properties')}
                  className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors"
                >
                  Réserver maintenant
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Réservations */}
      {activeTab === 'reservations' && (
        <div className="space-y-6">
          <ReservationsList
            reservations={allReservations}
            userType="traveler"
            title="Toutes mes réservations"
            showFilters={true}
          />
        </div>
      )}

      {/* Avis */}
      {activeTab === 'reviews' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Mes avis</h3>
          <ReviewsForm
            userType="traveler"
            onSuccess={() => {
              loadData();
            }}
          />
        </div>
      )}

      {/* Messages */}
      {activeTab === 'messages' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Messages</h3>
          <MessagingSystem
            userType="traveler"
            onSuccess={() => {
              // Recharger si nécessaire
            }}
          />
        </div>
      )}
    </div>
  );
};

export default TravelerDashboard;
