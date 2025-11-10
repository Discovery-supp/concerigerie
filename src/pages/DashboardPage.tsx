import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Home, Calendar, DollarSign, Users, Settings, LogOut, Package, Wrench } from 'lucide-react';
import StatCard from '../components/Dashboard/StatCard';
import QuickActionCard from '../components/Dashboard/QuickActionCard';
import OwnerDashboard from '../components/Dashboard/OwnerDashboard';
import AdminDashboard from '../components/Dashboard/AdminDashboard';
import TravelerDashboard from '../components/Dashboard/TravelerDashboard';
import ProviderDashboard from '../components/Dashboard/ProviderDashboard';

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
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (authError || !authUser) {
        navigate('/login');
        return;
      }

      // Utiliser maybeSingle() pour ne pas lancer d'erreur si le profil n'existe pas
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (profile) {
        setUser(profile as UserProfile);
        await loadStats(profile as UserProfile);
      } else if (profileError && profileError.code !== 'PGRST116') {
        // Erreur autre que "not found"
        console.error('Erreur récupération profil:', profileError);
      } else {
        // Profil n'existe pas encore - on peut afficher un message ou créer le profil
        console.warn('Profil utilisateur non trouvé. Le profil peut être créé plus tard.');
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
    // Si pas d'utilisateur ou pas de profil, afficher un message pour créer le profil
    if (!user) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">
            Votre profil n'est pas encore configuré.
          </p>
          <button
            onClick={() => navigate('/register')}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors"
          >
            Compléter mon profil
          </button>
        </div>
      );
    }

    // Si user_type est null ou undefined, afficher un message
    if (!user.user_type) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">
            Le type d'utilisateur n'est pas défini. Veuillez compléter votre profil.
          </p>
          <button
            onClick={() => navigate('/register')}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors"
          >
            Compléter mon profil
          </button>
        </div>
      );
    }

    switch (user.user_type) {
      case 'owner':
        return <OwnerDashboard userId={user.id} />;

      case 'provider':
        return <ProviderDashboard userId={user.id} />;

      case 'traveler':
        return <TravelerDashboard userId={user.id} />;

      case 'admin':
      case 'super_admin':
        return <AdminDashboard userId={user.id} />;

      case 'partner':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatCard
                icon={<Users className="w-8 h-8 text-blue-600" />}
                title="Partenariats actifs"
                value={stats.properties}
                bgColor="bg-blue-50"
              />
              <StatCard
                icon={<Calendar className="w-8 h-8 text-green-600" />}
                title="Réservations"
                value={stats.reservations}
                bgColor="bg-green-50"
              />
              <StatCard
                icon={<DollarSign className="w-8 h-8 text-yellow-600" />}
                title="Revenus"
                value={`$${stats.revenue.toFixed(2)}`}
                bgColor="bg-yellow-50"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <QuickActionCard
                title="Mes partenariats"
                description="Gérer mes partenariats"
                icon={<Users className="w-6 h-6" />}
                onClick={() => alert('Fonctionnalité en développement')}
                color="blue"
              />
              <QuickActionCard
                title="Paramètres"
                description="Gérer mon compte partenaire"
                icon={<Settings className="w-6 h-6" />}
                onClick={() => alert('Fonctionnalité en développement')}
                color="gray"
              />
            </div>
          </>
        );

      default:
        return (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-2">
              Type d'utilisateur non reconnu : <strong>{user?.user_type || 'non défini'}</strong>
            </p>
            <p className="text-gray-500 text-sm mb-4">
              Types valides : owner, provider, partner, admin, traveler
            </p>
            <button
              onClick={() => navigate('/register')}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors"
            >
              Compléter mon profil
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {getDashboardContent()}
      </div>
    </div>
  );
};

export default DashboardPage;
