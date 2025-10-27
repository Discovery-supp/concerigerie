import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import UserManagement from '../Admin/UserManagement';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Shield, 
  Settings,
  BarChart3,
  Home
} from 'lucide-react';

interface User {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  user_type: string;
  created_at: string;
}

interface Reservation {
  id: string;
  guest_name: string | null;
  property_title: string;
  check_in: string;
  check_out: string;
  total_amount: number;
  status: string;
}

interface Property {
  id: string;
  title: string;
  owner_name: string;
  price_per_night: number;
  status: string;
}

interface AdminStats {
  totalUsers: number;
  totalReservations: number;
  totalRevenue: number;
  monthlyGrowth: number;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalReservations: 0,
    totalRevenue: 0,
    monthlyGrowth: 0
  });
  const [selectedTab, setSelectedTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Charger les utilisateurs
      const { data: usersData, error: usersError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Charger les réservations
      const { data: reservationsData, error: reservationsError } = await supabase
        .from('reservations')
        .select(`
          *,
          properties!reservations_property_id_fkey(title),
          user_profiles!reservations_guest_id_fkey(first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (reservationsError) throw reservationsError;

      // Charger les propriétés
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select(`
          *,
          user_profiles!properties_owner_id_fkey(first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (propertiesError) throw propertiesError;

      setUsers(usersData || []);
      setReservations(reservationsData || []);
      setProperties(propertiesData || []);

      // Calculer les statistiques
      const totalRevenue = reservationsData?.reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0;
      const monthlyGrowth = 12.5; // Calculer la croissance réelle

      setStats({
        totalUsers: usersData?.length || 0,
        totalReservations: reservationsData?.length || 0,
        totalRevenue,
        monthlyGrowth
      });
    } catch (error) {
      console.error('Erreur chargement données:', error);
    }
  };

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case 'super_admin': return 'bg-red-100 text-red-800';
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'owner': return 'bg-blue-100 text-blue-800';
      case 'traveler': return 'bg-green-100 text-green-800';
      case 'provider': return 'bg-yellow-100 text-yellow-800';
      case 'partner': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredUsers = users.filter(user =>
    user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
    { id: 'users', label: 'Utilisateurs', icon: Users },
    { id: 'properties', label: 'Propriétés', icon: Home },
    { id: 'reservations', label: 'Réservations', icon: Calendar },
    { id: 'analytics', label: 'Analyses', icon: TrendingUp },
    { id: 'settings', label: 'Paramètres', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord administrateur</h1>
          <p className="text-gray-600 mt-2">Gérez votre plateforme Nzoo Immo Conciergerie</p>
        </div>

        {/* Actions rapides */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickActionCard
              title="Gérer les utilisateurs"
              description="Créer et administrer les comptes"
              icon={<Users className="w-6 h-6" />}
              color="blue"
              onClick={() => setSelectedTab('users')}
            />
            <QuickActionCard
              title="Modérer les propriétés"
              description="Valider et gérer les annonces"
              icon={<Shield className="w-6 h-6" />}
              color="green"
              onClick={() => setSelectedTab('properties')}
            />
            <QuickActionCard
              title="Analyses détaillées"
              description="Consulter les statistiques"
              icon={<TrendingUp className="w-6 h-6" />}
              color="purple"
              onClick={() => setSelectedTab('analytics')}
            />
            <QuickActionCard
              title="Paramètres système"
              description="Configurer la plateforme"
              icon={<Settings className="w-6 h-6" />}
              color="orange"
              onClick={() => setSelectedTab('settings')}
            />
          </div>
        </div>

        {/* Navigation par onglets */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    selectedTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Contenu des onglets */}
        {selectedTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Statistiques */}
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                icon={<Users className="w-8 h-8 text-blue-600" />}
                title="Utilisateurs"
                value={stats.totalUsers}
                subtitle="Total inscrits"
                bgColor="bg-white"
              />
              <StatCard
                icon={<Calendar className="w-8 h-8 text-green-600" />}
                title="Réservations"
                value={stats.totalReservations}
                subtitle="Ce mois"
                bgColor="bg-white"
              />
              <StatCard
                icon={<DollarSign className="w-8 h-8 text-purple-600" />}
                title="Revenus"
                value={`€${stats.totalRevenue.toLocaleString()}`}
                subtitle="Total"
                bgColor="bg-white"
              />
              <StatCard
                icon={<TrendingUp className="w-8 h-8 text-orange-600" />}
                title="Croissance"
                value={`+${stats.monthlyGrowth}%`}
                subtitle="Ce mois"
                bgColor="bg-white"
              />
            </div>

            {/* Réservations récentes */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Réservations récentes</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {reservations.slice(0, 5).map((reservation) => (
                  <div key={reservation.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {reservation.guest_name || 'Invité'}
                        </h3>
                        <p className="text-sm text-gray-500">{reservation.property_title}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(reservation.check_in).toLocaleDateString('fr-FR')} - 
                          {new Date(reservation.check_out).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          €{reservation.total_amount}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(reservation.status)}`}>
                          {reservation.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'users' && (
          <UserManagement />
        )}

        {selectedTab === 'properties' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Toutes les propriétés</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Propriété
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Propriétaire
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prix/nuit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {properties.map((property) => (
                    <tr key={property.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{property.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {property.owner_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        €{property.price_per_night}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(property.status)}`}>
                          {property.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">
                          Modérer
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedTab === 'reservations' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Toutes les réservations</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Propriété
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
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reservations.map((reservation) => (
                    <tr key={reservation.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {reservation.guest_name || 'Invité'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {reservation.property_title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(reservation.check_in).toLocaleDateString('fr-FR')} - 
                        {new Date(reservation.check_out).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        €{reservation.total_amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(reservation.status)}`}>
                          {reservation.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedTab === 'analytics' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Analyses détaillées</h2>
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Analyses en cours de développement</h3>
              <p className="text-gray-600">Les analyses détaillées seront bientôt disponibles</p>
            </div>
          </div>
        )}

        {selectedTab === 'settings' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Paramètres système</h2>
            <div className="text-center py-12">
              <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Paramètres en cours de développement</h3>
              <p className="text-gray-600">Les paramètres système seront bientôt disponibles</p>
            </div>
          </div>
        )}
      </div>
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

export default AdminDashboard;