import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Home, Calendar, DollarSign, Users, Settings, LogOut, Package, Wrench, MessageCircle, Star } from 'lucide-react';
import HostDashboard from '../components/Dashboard/HostDashboard';
import AdminDashboard from '../components/Dashboard/AdminDashboard';
import TravelerDashboard from '../components/Dashboard/TravelerDashboard';
import ProviderDashboard from '../components/Dashboard/ProviderDashboard';
import NotificationSystem from '../components/Notifications/NotificationSystem';

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: 'owner' | 'provider' | 'partner' | 'admin' | 'traveler';
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    properties: 0,
    reservations: 0,
    revenue: 0,
    reviews: 0,
    jobs: 0
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        navigate('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profile) {
        setUser(profile as UserProfile);
        await loadStats(profile as UserProfile);
      }
    } catch (error) {
      console.error('Erreur:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (profile: UserProfile) => {
    try {
      if (profile.user_type === 'owner') {
        const { data: properties } = await supabase
          .from('properties')
          .select('id')
          .eq('owner_id', profile.id);

        const propertyIds = properties?.map(p => p.id) || [];

        const { data: reservations } = await supabase
          .from('reservations')
          .select('total_amount')
          .in('property_id', propertyIds);

        const { data: reviews } = await supabase
          .from('reviews')
          .select('id')
          .in('property_id', propertyIds);

        const totalRevenue = reservations?.reduce((sum, r) => sum + Number(r.total_amount), 0) || 0;

        setStats({
          properties: properties?.length || 0,
          reservations: reservations?.length || 0,
          revenue: totalRevenue,
          reviews: reviews?.length || 0,
          jobs: 0
        });
      } else if (profile.user_type === 'traveler') {
        const { data: reservations } = await supabase
          .from('reservations')
          .select('total_amount')
          .eq('guest_id', profile.id);

        setStats({
          properties: 0,
          reservations: reservations?.length || 0,
          revenue: 0,
          reviews: 0,
          jobs: 0
        });
      } else if (profile.user_type === 'provider') {
        const { data: providerProfile } = await supabase
          .from('service_providers')
          .select('completed_jobs')
          .eq('user_id', profile.id)
          .single();

        setStats({
          properties: 0,
          reservations: 0,
          revenue: 0,
          reviews: 0,
          jobs: providerProfile?.completed_jobs || 0
        });
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  const getDashboardContent = () => {
    switch (user?.user_type) {
      case 'owner':
        return <HostDashboard />;

      case 'provider':
        return <ProviderDashboard />;

      case 'traveler':
        return <TravelerDashboard />;

      case 'admin':
        return <AdminDashboard />;

      default:
        return (
          <div className="text-center py-12">
            <p className="text-gray-600">Type d'utilisateur non reconnu</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Bonjour, {user?.first_name || 'Utilisateur'}
            </h1>
            <p className="text-gray-600 mt-1">
              Bienvenue dans votre espace{' '}
              {user?.user_type === 'owner' && 'propriétaire'}
              {user?.user_type === 'provider' && 'prestataire'}
              {user?.user_type === 'traveler' && 'voyageur'}
              {user?.user_type === 'admin' && 'administrateur'}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <NotificationSystem userType={user?.user_type || 'traveler'} />
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>

        {getDashboardContent()}
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  value: string | number;
  bgColor: string;
}> = ({ icon, title, value, bgColor }) => (
  <div className={`${bgColor} rounded-xl p-6 shadow-sm`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <div>{icon}</div>
    </div>
  </div>
);

const QuickActionCard: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  color: string;
}> = ({ title, description, icon, onClick, color }) => {
  const colorClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700',
    orange: 'bg-orange-600 hover:bg-orange-700',
    gray: 'bg-gray-600 hover:bg-gray-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
    yellow: 'bg-yellow-600 hover:bg-yellow-700'
  };

  return (
    <button
      onClick={onClick}
      className={`${colorClasses[color as keyof typeof colorClasses]} text-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all text-left`}
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

export default DashboardPage;
