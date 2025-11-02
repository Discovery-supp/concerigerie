import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import StatCard from './StatCard';
import QuickActionCard from './QuickActionCard';
import ReservationsList from './ReservationsList';
import PerformanceStats from './PerformanceStats';
import PaymentReports from './PaymentReports';
import FinancialReports from './FinancialReports';
import CreateAdminAccount from './CreateAdminAccount';
import { Users, Calendar, Home, DollarSign, Settings, BarChart3, FileText, Download, Edit, Trash2, Shield, UserPlus, MessageCircle } from 'lucide-react';
import MessagingSystem from '../Forms/MessagingSystem';

interface AdminDashboardProps {
  userId: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ userId }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'create_admin' | 'reservations' | 'stats' | 'financial' | 'support' | 'analytics' | 'messages'>('overview');
  const [users, setUsers] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [currentUserType, setCurrentUserType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalHosts: 0,
    totalTravelers: 0,
    totalProperties: 0,
    totalReservations: 0,
    totalRevenue: 0,
    occupancyRate: 0
  });

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      // Vérifier le type de l'utilisateur actuel
      const { data: currentProfile } = await supabase
        .from('user_profiles')
        .select('user_type')
        .eq('id', userId)
        .single();

      setCurrentUserType(currentProfile?.user_type || null);

      // Charger tous les utilisateurs
      const { data: usersData } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      // Charger toutes les réservations
      const { data: reservationsData } = await supabase
        .from('reservations')
        .select(`
          *,
          property:properties(id, title, address, images),
          guest:user_profiles!reservations_guest_id_fkey(id, first_name, last_name, email)
        `)
        .order('created_at', { ascending: false });

      // Charger toutes les propriétés
      const { data: propertiesData } = await supabase
        .from('properties')
        .select('id');

      // Calculer les statistiques
      const totalRevenue = reservationsData?.reduce((sum, r) => sum + Number(r.total_amount || 0), 0) || 0;
      const confirmedReservations = reservationsData?.filter(r => r.status === 'confirmed').length || 0;
      const occupancyRate = propertiesData?.length 
        ? (confirmedReservations / propertiesData.length) * 100 
        : 0;

      setStats({
        totalUsers: usersData?.length || 0,
        totalHosts: usersData?.filter(u => u.user_type === 'owner').length || 0,
        totalTravelers: usersData?.filter(u => u.user_type === 'traveler').length || 0,
        totalProperties: propertiesData?.length || 0,
        totalReservations: reservationsData?.length || 0,
        totalRevenue,
        occupancyRate
      });

      setUsers(usersData || []);
      setReservations(reservationsData || []);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Erreur suppression utilisateur:', error);
    }
  };

  const handleExportUsers = () => {
    const csv = [
      ['Email', 'Nom', 'Prénom', 'Type', 'Téléphone', 'Date de création'].join(','),
      ...users.map(u => [
        u.email || '',
        u.last_name || '',
        u.first_name || '',
        u.user_type || '',
        u.phone || '',
        new Date(u.created_at).toLocaleDateString('fr-FR')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `utilisateurs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
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
            { id: 'users', label: 'Utilisateurs', icon: Users },
            ...(currentUserType === 'super_admin' ? [{ id: 'create_admin', label: 'Créer Admin', icon: UserPlus }] : []),
            { id: 'reservations', label: 'Réservations', icon: Calendar },
            { id: 'messages', label: 'Messages', icon: MessageCircle },
            { id: 'stats', label: 'Statistiques', icon: BarChart3 },
            { id: 'financial', label: 'Financier', icon: DollarSign },
            { id: 'support', label: 'Support', icon: Settings },
            { id: 'analytics', label: 'Analytique', icon: BarChart3 }
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={<Users className="w-8 h-8 text-blue-600" />}
              title="Utilisateurs totaux"
              value={stats.totalUsers}
              bgColor="bg-blue-50"
            />
            <StatCard
              icon={<Home className="w-8 h-8 text-green-600" />}
              title="Propriétés"
              value={stats.totalProperties}
              bgColor="bg-green-50"
            />
            <StatCard
              icon={<Calendar className="w-8 h-8 text-yellow-600" />}
              title="Réservations"
              value={stats.totalReservations}
              bgColor="bg-yellow-50"
            />
            <StatCard
              icon={<DollarSign className="w-8 h-8 text-purple-600" />}
              title="Revenus totaux"
              value={`${stats.totalRevenue.toFixed(2)} €`}
              bgColor="bg-purple-50"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <QuickActionCard
              title="Gestion des utilisateurs"
              description={`${stats.totalUsers} utilisateurs, ${stats.totalHosts} hôtes`}
              icon={<Users className="w-6 h-6" />}
              onClick={() => setActiveTab('users')}
              color="blue"
            />
            {currentUserType === 'super_admin' && (
              <QuickActionCard
                title="Créer un compte admin"
                description="Ajouter un nouvel administrateur"
                icon={<UserPlus className="w-6 h-6" />}
                onClick={() => setActiveTab('create_admin')}
                color="red"
              />
            )}
            <QuickActionCard
              title="Toutes les réservations"
              description={`${stats.totalReservations} réservations`}
              icon={<Calendar className="w-6 h-6" />}
              onClick={() => setActiveTab('reservations')}
              color="green"
            />
            <QuickActionCard
              title="Rapports financiers"
              description="Revenus et commissions"
              icon={<DollarSign className="w-6 h-6" />}
              onClick={() => setActiveTab('financial')}
              color="orange"
            />
            <QuickActionCard
              title="Messagerie"
              description="Communiquer avec les utilisateurs"
              icon={<MessageCircle className="w-6 h-6" />}
              onClick={() => setActiveTab('messages')}
              color="purple"
            />
          </div>
        </>
      )}

      {/* Créer un compte admin (seulement pour super_admin) */}
      {activeTab === 'create_admin' && currentUserType === 'super_admin' && (
        <CreateAdminAccount onSuccess={loadData} />
      )}

      {/* Gestion des utilisateurs */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Gestion des Utilisateurs</h3>
            <button
              onClick={handleExportUsers}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Exporter</span>
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date création</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.first_name} {user.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.user_type === 'super_admin' ? 'bg-red-600 text-white' :
                        user.user_type === 'admin' ? 'bg-red-100 text-red-800' :
                        user.user_type === 'owner' ? 'bg-blue-100 text-blue-800' :
                        user.user_type === 'traveler' ? 'bg-green-100 text-green-800' :
                        user.user_type === 'provider' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.user_type === 'super_admin' ? 'Super Admin' : user.user_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {/* Modifier */}}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Réservations */}
      {activeTab === 'reservations' && (
        <ReservationsList
          reservations={reservations}
          userType="admin"
          title="Toutes les réservations"
        />
      )}

      {/* Messages */}
      {activeTab === 'messages' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <MessagingSystem
            userType="admin"
            onSuccess={() => {
              // Recharger si nécessaire
            }}
          />
        </div>
      )}

      {/* Statistiques */}
      {activeTab === 'stats' && (
        <PerformanceStats
          occupancyRate={stats.occupancyRate}
          revenue={stats.totalRevenue}
          monthlyRevenue={stats.totalRevenue / 12}
          previousMonthRevenue={stats.totalRevenue / 24}
          totalReservations={stats.totalReservations}
          totalProperties={stats.totalProperties}
        />
      )}

      {/* Rapports financiers */}
      {activeTab === 'financial' && (
        <FinancialReports userId={userId} />
      )}

      {/* Support */}
      {activeTab === 'support' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Support Client</h3>
          <p className="text-gray-500">Interface de gestion du support en développement</p>
        </div>
      )}

      {/* Analytique */}
      {activeTab === 'analytics' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Analytique du Site</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Trafic web</h4>
              <p className="text-2xl font-bold">N/A</p>
              <p className="text-sm text-gray-500">À intégrer avec Google Analytics</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Taux de conversion</h4>
              <p className="text-2xl font-bold">N/A</p>
              <p className="text-sm text-gray-500">À calculer</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

