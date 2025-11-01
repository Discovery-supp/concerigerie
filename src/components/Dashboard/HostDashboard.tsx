import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import HostEarnings from './HostEarnings';
import { 
  Calendar, 
  Users, 
  DollarSign, 
  Star, 
  MessageCircle, 
  Bell, 
  TrendingUp, 
  Home,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Settings,
  CreditCard
} from 'lucide-react';

interface Reservation {
  id: string;
  property_id: string;
  guest_id: string;
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status: 'pending' | 'paid' | 'refunded';
  special_requests?: string;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  property_title?: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  guest_name?: string;
  created_at: string;
}

interface Property {
  id: string;
  title: string;
  address: string;
  price_per_night: number;
  is_published: boolean;
}

interface HostStats {
  totalReservations: number;
  currentReservations: number;
  totalRevenue: number;
  averageRating: number;
  occupancyRate: number;
  monthlyGrowth: number;
}

const HostDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [stats, setStats] = useState<HostStats>({
    totalReservations: 0,
    currentReservations: 0,
    totalRevenue: 0,
    averageRating: 0,
    occupancyRate: 0,
    monthlyGrowth: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    loadDashboardData();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    } catch (error) {
      console.error('Erreur récupération utilisateur:', error);
    }
  };

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Charger les propriétés de l'hôte
      const { data: hostProperties } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', user.id);

      setProperties(hostProperties || []);

      // Charger les réservations
      const propertyIds = hostProperties?.map(p => p.id) || [];
      let reservationsData: any[] = [];
      
      if (propertyIds.length > 0) {
        const { data: reservations } = await supabase
          .from('reservations')
          .select(`
            *,
            user_profiles!reservations_guest_id_fkey(first_name, last_name, email, phone),
            properties!reservations_property_id_fkey(title)
          `)
          .in('property_id', propertyIds)
          .order('created_at', { ascending: false });

        reservationsData = reservations || [];
        setReservations(reservationsData);

        // Charger les avis
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select(`
            *,
            user_profiles!reviews_guest_id_fkey(first_name, last_name)
          `)
          .in('property_id', propertyIds)
          .order('created_at', { ascending: false })
          .limit(5);

        setReviews(reviewsData || []);
      }

      // Calculer les statistiques
      calculateStats(hostProperties || [], reservationsData);

    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (properties: Property[], reservations: Reservation[]) => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Réservations actuelles (ce mois)
    const currentReservations = reservations.filter(r => {
      const reservationDate = new Date(r.created_at);
      return reservationDate.getMonth() === currentMonth && 
             reservationDate.getFullYear() === currentYear;
    });

    // Revenus totaux
    const totalRevenue = reservations
      .filter(r => r.status === 'confirmed' || r.status === 'completed')
      .reduce((sum, r) => sum + r.total_amount, 0);

    // Note moyenne
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0;

    // Taux d'occupation (simplifié)
    const totalNights = reservations
      .filter(r => r.status === 'confirmed' || r.status === 'completed')
      .reduce((sum, r) => {
        const checkIn = new Date(r.check_in);
        const checkOut = new Date(r.check_out);
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        return sum + nights;
      }, 0);

    const availableNights = properties.length * 30; // 30 jours par propriété
    const occupancyRate = availableNights > 0 ? (totalNights / availableNights) * 100 : 0;

    setStats({
      totalReservations: reservations.length,
      currentReservations: currentReservations.length,
      totalRevenue,
      averageRating,
      occupancyRate,
      monthlyGrowth: 0 // À calculer avec les données historiques
    });
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'cancelled': return <AlertCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord Hôte</h1>
        <p className="text-gray-600 mt-1">Gérez vos propriétés et réservations</p>
      </div>

      {/* Onglets */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <BarChart3 className="w-4 h-4 mr-2" />
                Vue d'ensemble
              </div>
            </button>
            <button
              onClick={() => setActiveTab('earnings')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'earnings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <CreditCard className="w-4 h-4 mr-2" />
                Mes Gains
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'overview' && (
        <>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<Calendar className="w-8 h-8 text-blue-600" />}
          title="Réservations ce mois"
          value={stats.currentReservations}
          subtitle={`${stats.totalReservations} au total`}
          bgColor="bg-blue-50"
        />
        <StatCard
          icon={<DollarSign className="w-8 h-8 text-green-600" />}
          title="Revenus totaux"
          value={`€${stats.totalRevenue.toFixed(2)}`}
          subtitle={`+${stats.monthlyGrowth}% ce mois`}
          bgColor="bg-green-50"
        />
        <StatCard
          icon={<Star className="w-8 h-8 text-yellow-600" />}
          title="Note moyenne"
          value={stats.averageRating.toFixed(1)}
          subtitle={`${reviews.length} avis`}
          bgColor="bg-yellow-50"
        />
        <StatCard
          icon={<TrendingUp className="w-8 h-8 text-purple-600" />}
          title="Taux d'occupation"
          value={`${stats.occupancyRate.toFixed(1)}%`}
          subtitle="Performance"
          bgColor="bg-purple-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Réservations en cours */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Réservations récentes</h2>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1"
                >
                  <option value="week">Cette semaine</option>
                  <option value="month">Ce mois</option>
                  <option value="all">Toutes</option>
                </select>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {reservations.slice(0, 5).map((reservation) => (
                <div key={reservation.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">
                            {reservation.guest_name || 'Invité'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {reservation.property_title}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                        <span>
                          {new Date(reservation.check_in).toLocaleDateString('fr-FR')} - 
                          {new Date(reservation.check_out).toLocaleDateString('fr-FR')}
                        </span>
                        <span>€{reservation.total_amount}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(reservation.status)}`}>
                        {getStatusIcon(reservation.status)}
                        <span className="ml-1">{reservation.status}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Avis récents */}
        <div>
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Avis récents</h2>
            </div>
            <div className="p-6">
              {reviews.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Aucun avis pour le moment</p>
              ) : (
                <div className="space-y-4">
                  {reviews.slice(0, 3).map((review) => (
                    <div key={review.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= review.rating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{review.comment}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Par {review.guest_name || 'Invité'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionCard
            title="Gérer les propriétés"
            description="Voir et modifier vos propriétés"
            icon={<Home className="w-6 h-6" />}
            color="blue"
            onClick={() => navigate('/properties')}
          />
          <QuickActionCard
            title="Calendrier"
            description="Voir les réservations"
            icon={<Calendar className="w-6 h-6" />}
            color="green"
            onClick={() => navigate('/reservations')}
          />
          <QuickActionCard
            title="Messages"
            description="Communication"
            icon={<MessageCircle className="w-6 h-6" />}
            color="purple"
            onClick={() => navigate('/messages')}
          />
          <QuickActionCard
            title="Statistiques"
            description="Analyses détaillées"
            icon={<BarChart3 className="w-6 h-6" />}
            color="orange"
            onClick={() => navigate('/analytics')}
          />
        </div>
      </div>
        </>
      )}

      {activeTab === 'earnings' && currentUserId && (
        <HostEarnings hostId={currentUserId} />
      )}
    </div>
  );
};

const StatCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  bgColor: string;
}> = ({ icon, title, value, subtitle, bgColor }) => (
  <div className={`${bgColor} rounded-xl p-6 shadow-sm`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div>{icon}</div>
    </div>
  </div>
);

const QuickActionCard: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}> = ({ title, description, icon, color, onClick }) => {
  const colorClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
    orange: 'bg-orange-600 hover:bg-orange-700'
  };

  return (
    <button
      onClick={onClick}
      className={`${colorClasses[color as keyof typeof colorClasses]} text-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all text-left cursor-pointer`}
    >
      <div className="flex items-start space-x-4">
        <div className="bg-white bg-opacity-20 rounded-lg p-3">{icon}</div>
        <div>
          <h3 className="text-lg font-semibold mb-1">{title}</h3>
          <p className="text-sm text-white text-opacity-90">{description}</p>
        </div>
      </div>
    </button>
  );
};

export default HostDashboard;
