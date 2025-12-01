import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Calendar, 
  DollarSign, 
  Users, 
  Home,
  Star,
  Clock,
  MapPin,
  Filter,
  Download
} from 'lucide-react';

interface AnalyticsData {
  revenue: {
    total: number;
    monthly: number;
    growth: number;
    trend: 'up' | 'down';
  };
  occupancy: {
    rate: number;
    totalNights: number;
    availableNights: number;
    trend: 'up' | 'down';
  };
  bookings: {
    total: number;
    confirmed: number;
    cancelled: number;
    pending: number;
    trend: 'up' | 'down';
  };
  reviews: {
    average: number;
    total: number;
    distribution: { [key: number]: number };
    trend: 'up' | 'down';
  };
  properties: {
    total: number;
    published: number;
    draft: number;
    averagePrice: number;
  };
  users: {
    total: number;
    newThisMonth: number;
    active: number;
    growth: number;
  };
}

interface TimeSeriesData {
  date: string;
  revenue: number;
  bookings: number;
  occupancy: number;
}

const AnalyticsDashboard: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Charger les données de réservations
      const { data: reservations } = await supabase
        .from('reservations')
        .select('*')
        .order('created_at', { ascending: false });

      // Charger les données de propriétés
      const { data: properties } = await supabase
        .from('properties')
        .select('*');

      // Charger les données d'utilisateurs
      const { data: users } = await supabase
        .from('user_profiles')
        .select('*');

      // Charger les données d'avis
      const { data: reviews } = await supabase
        .from('reviews')
        .select('*');

      // Calculer les métriques
      const analytics = calculateAnalytics(reservations || [], properties || [], users || [], reviews || []);
      setAnalyticsData(analytics);

      // Générer des données de série temporelle pour la démo
      const timeSeries = generateTimeSeriesData();
      setTimeSeriesData(timeSeries);

    } catch (error) {
      console.error('Erreur chargement analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (reservations: any[], properties: any[], users: any[], reviews: any[]) => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Revenus
    const totalRevenue = reservations
      .filter(r => r.status === 'confirmed' || r.status === 'completed')
      .reduce((sum, r) => sum + r.total_amount, 0);

    const monthlyRevenue = reservations
      .filter(r => {
        const date = new Date(r.created_at);
        return date.getMonth() === currentMonth && 
               date.getFullYear() === currentYear &&
               (r.status === 'confirmed' || r.status === 'completed');
      })
      .reduce((sum, r) => sum + r.total_amount, 0);

    // Occupancy
    const totalNights = reservations
      .filter(r => r.status === 'confirmed' || r.status === 'completed')
      .reduce((sum, r) => {
        const checkIn = new Date(r.check_in);
        const checkOut = new Date(r.check_out);
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        return sum + nights;
      }, 0);

    const availableNights = properties.length * 30;
    const occupancyRate = availableNights > 0 ? (totalNights / availableNights) * 100 : 0;

    // Bookings
    const totalBookings = reservations.length;
    const confirmedBookings = reservations.filter(r => r.status === 'confirmed').length;
    const cancelledBookings = reservations.filter(r => r.status === 'cancelled').length;
    const pendingBookings = reservations.filter(r => r.status === 'pending').length;

    // Reviews
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0;

    const ratingDistribution = reviews.reduce((dist, r) => {
      dist[r.rating] = (dist[r.rating] || 0) + 1;
      return dist;
    }, {} as { [key: number]: number });

    // Properties
    const publishedProperties = properties.filter(p => p.is_published).length;
    const averagePrice = properties.length > 0 
      ? properties.reduce((sum, p) => sum + p.price_per_night, 0) / properties.length 
      : 0;

    // Users
    const newUsersThisMonth = users.filter(u => {
      const date = new Date(u.created_at);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;

    return {
      revenue: {
        total: totalRevenue,
        monthly: monthlyRevenue,
        growth: 15.2,
        trend: 'up' as const
      },
      occupancy: {
        rate: occupancyRate,
        totalNights,
        availableNights,
        trend: 'up' as const
      },
      bookings: {
        total: totalBookings,
        confirmed: confirmedBookings,
        cancelled: cancelledBookings,
        pending: pendingBookings,
        trend: 'up' as const
      },
      reviews: {
        average: averageRating,
        total: reviews.length,
        distribution: ratingDistribution,
        trend: 'up' as const
      },
      properties: {
        total: properties.length,
        published: publishedProperties,
        draft: properties.length - publishedProperties,
        averagePrice
      },
      users: {
        total: users.length,
        newThisMonth: newUsersThisMonth,
        active: users.length,
        growth: 8.5
      }
    };
  };

  const generateTimeSeriesData = () => {
    const data: TimeSeriesData[] = [];
    const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        revenue: Math.random() * 1000 + 500,
        bookings: Math.floor(Math.random() * 10) + 1,
        occupancy: Math.random() * 100
      });
    }
    
    return data;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des analytics...</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune donnée disponible</h3>
          <p className="text-gray-600">Les analytics nécessitent des données pour fonctionner</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics & Rapports</h1>
            <p className="text-gray-600 mt-1">Analysez les performances de votre plateforme</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">7 derniers jours</option>
              <option value="30d">30 derniers jours</option>
              <option value="90d">90 derniers jours</option>
            </select>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Exporter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Revenus totaux"
          value={`€${analyticsData.revenue.total.toFixed(2)}`}
          change={analyticsData.revenue.growth}
          trend={analyticsData.revenue.trend}
          icon={<DollarSign className="w-8 h-8 text-green-600" />}
          bgColor="bg-green-50"
        />
        <MetricCard
          title="Taux d'occupation"
          value={`${analyticsData.occupancy.rate.toFixed(1)}%`}
          change={5.2}
          trend="up"
          icon={<Home className="w-8 h-8 text-blue-600" />}
          bgColor="bg-blue-50"
        />
        <MetricCard
          title="Réservations"
          value={analyticsData.bookings.total}
          change={12.5}
          trend="up"
          icon={<Calendar className="w-8 h-8 text-purple-600" />}
          bgColor="bg-purple-50"
        />
        <MetricCard
          title="Note moyenne"
          value={analyticsData.reviews.average.toFixed(1)}
          change={2.1}
          trend="up"
          icon={<Star className="w-8 h-8 text-yellow-600" />}
          bgColor="bg-yellow-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Graphique des revenus */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Évolution des revenus</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSelectedMetric('revenue')}
                className={`px-3 py-1 rounded-md text-sm ${
                  selectedMetric === 'revenue' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Revenus
              </button>
              <button
                onClick={() => setSelectedMetric('bookings')}
                className={`px-3 py-1 rounded-md text-sm ${
                  selectedMetric === 'bookings' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Réservations
              </button>
            </div>
          </div>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Graphique des revenus</p>
              <p className="text-sm text-gray-500">Intégration avec une bibliothèque de graphiques</p>
            </div>
          </div>
        </div>

        {/* Répartition des avis */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition des avis</h3>
          <div className="space-y-4">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  <span className="text-sm text-gray-600 w-2">{rating}</span>
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full"
                    style={{
                      width: `${analyticsData.reviews.distribution[rating] 
                        ? (analyticsData.reviews.distribution[rating] / analyticsData.reviews.total) * 100 
                        : 0}%`
                    }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-8">
                  {analyticsData.reviews.distribution[rating] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tableaux détaillés */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top propriétés */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Top propriétés</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {[
              { name: 'Villa Paradis', revenue: 2500, bookings: 12 },
              { name: 'Appartement Centre', revenue: 1800, bookings: 8 },
              { name: 'Studio Moderne', revenue: 1200, bookings: 6 }
            ].map((property, index) => (
              <div key={index} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{property.name}</h4>
                    <p className="text-sm text-gray-500">{property.bookings} réservations</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">€{property.revenue}</p>
                    <p className="text-xs text-gray-500">Revenus</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Statistiques utilisateurs */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Statistiques utilisateurs</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total utilisateurs</span>
              <span className="text-sm font-medium text-gray-900">{analyticsData.users.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Nouveaux ce mois</span>
              <span className="text-sm font-medium text-gray-900">{analyticsData.users.newThisMonth}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Utilisateurs actifs</span>
              <span className="text-sm font-medium text-gray-900">{analyticsData.users.active}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Croissance</span>
              <span className="text-sm font-medium text-green-600">+{analyticsData.users.growth}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{
  title: string;
  value: string;
  change: number;
  trend: 'up' | 'down';
  icon: React.ReactNode;
  bgColor: string;
}> = ({ title, value, change, trend, icon, bgColor }) => (
  <div className={`${bgColor} rounded-xl p-6 shadow-sm`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <div className="flex items-center mt-1">
          {trend === 'up' ? (
            <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
          )}
          <span className={`text-xs ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {change > 0 ? '+' : ''}{change}%
          </span>
        </div>
      </div>
      <div>{icon}</div>
    </div>
  </div>
);

export default AnalyticsDashboard;


