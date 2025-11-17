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
import EditUserModal from '../Admin/EditUserModal';
import { Users, Calendar, Home, DollarSign, Settings, BarChart3, FileText, Download, Edit, Trash2, Shield, UserPlus, MessageCircle, Power, PowerOff, X } from 'lucide-react';
import MessagingSystem from '../Forms/MessagingSystem';

interface AdminDashboardProps {
  userId: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ userId }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'create_admin' | 'reservations' | 'stats' | 'financial' | 'support' | 'analytics' | 'messages' | 'properties'>('overview');
  const [users, setUsers] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [currentUserType, setCurrentUserType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalHosts: 0,
    totalTravelers: 0,
    totalProperties: 0,
    totalReservations: 0,
    totalRevenue: 0,
    additionalServicesRevenue: 0,
    providerServicesRevenue: 0,
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
      // Essayer d'abord avec toutes les colonnes, puis avec des colonnes spécifiques si ça échoue
      let usersData: any[] | null = null;
      let usersError: any = null;

      try {
        console.log('[AdminDashboard] Tentative de chargement des utilisateurs avec SELECT *');
        const result = await supabase
          .from('user_profiles')
          .select('*')
          .order('created_at', { ascending: false });
        
        console.log('[AdminDashboard] Résultat SELECT *:', { data: result.data, error: result.error });
        usersData = result.data;
        usersError = result.error;
      } catch (err: any) {
        console.error('[AdminDashboard] Exception lors de SELECT *:', err);
        // Si la requête échoue (peut-être à cause de la colonne is_active manquante), essayer sans
        console.warn('Erreur avec SELECT *, tentative avec colonnes spécifiques:', err);
        try {
          console.log('[AdminDashboard] Tentative avec colonnes spécifiques (sans email)');
          // Essayer sans email (qui n'existe pas dans user_profiles)
          const result = await supabase
            .from('user_profiles')
            .select('id, first_name, last_name, phone, user_type, created_at, updated_at')
            .order('created_at', { ascending: false });
          
          console.log('[AdminDashboard] Résultat colonnes spécifiques:', { data: result.data, error: result.error });
          usersData = result.data;
          usersError = result.error;
          
          // Si ça fonctionne, enrichir avec les emails depuis auth.users
          if (usersData && !usersError && usersData.length > 0) {
            const userIds = usersData.map(u => u.id);
            // Note: On ne peut pas directement accéder à auth.users depuis le client
            // Il faudrait une fonction Edge ou une vue, mais pour l'instant on continue sans email
            usersData = usersData.map((user: any) => ({
              ...user,
              email: 'N/A' // Email non disponible depuis user_profiles
            }));
          }
        } catch (err2: any) {
          usersError = err2;
        }
      }

      if (usersError) {
        console.error('[AdminDashboard] Erreur chargement utilisateurs:', usersError);
        console.error('[AdminDashboard] Détails erreur:', {
          message: usersError.message,
          code: usersError.code,
          details: usersError.details,
          hint: usersError.hint
        });
        
        // Vérifier si c'est une erreur RLS
        if (usersError.message?.includes('policy') || usersError.message?.includes('permission') || usersError.code === '42501') {
          setUsersError(`Erreur de permissions: ${usersError.message}. Assurez-vous que la migration RLS a été exécutée et que vous êtes connecté en tant qu'admin.`);
        } else {
          setUsersError(`Erreur: ${usersError.message} (Code: ${usersError.code || 'N/A'})`);
        }
      } else {
        // S'assurer que is_active existe pour chaque utilisateur (par défaut true si absent)
        // Et s'assurer que email existe (même si c'est 'N/A')
        const usersWithActive = (usersData || []).map((user: any) => ({
          ...user,
          is_active: user.is_active !== undefined && user.is_active !== null ? user.is_active : true,
          email: user.email || 'N/A'
        }));
        console.log('[AdminDashboard] Utilisateurs chargés avec succès:', usersWithActive?.length || 0, usersWithActive);
        setUsers(usersWithActive);
        setUsersError(null);
      }

      // Charger toutes les réservations (y compris les demandes d'annulation)
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
      
      // Calculer les revenus des services supplémentaires
      const additionalServicesRevenue = reservationsData?.reduce((sum, r) => {
        if (r.additional_services && Array.isArray(r.additional_services)) {
          const servicesTotal = r.additional_services.reduce((serviceSum: number, service: any) => {
            if (typeof service === 'object' && service.totalPrice) {
              return serviceSum + Number(service.totalPrice || 0);
            }
            return serviceSum;
          }, 0);
          return sum + servicesTotal;
        }
        return sum;
      }, 0) || 0;

      // Calculer les revenus des prestataires (à partir des réservations de services de prestataires)
      // Note: Cette logique dépend de votre structure de données pour les services de prestataires
      // Pour l'instant, on peut utiliser une table séparée ou un champ dans les réservations
      const { data: providerBookings } = await supabase
        .from('service_bookings')
        .select('total_amount, status')
        .in('status', ['confirmed', 'completed'])
        .catch(() => ({ data: null })); // Si la table n'existe pas, ignorer

      const providerServicesRevenue = providerBookings?.reduce((sum: number, booking: any) => 
        sum + Number(booking.total_amount || 0), 0) || 0;

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
        additionalServicesRevenue,
        providerServicesRevenue,
        occupancyRate
      });

      // Les utilisateurs sont déjà définis dans le bloc précédent
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

  const handleToggleUserActive = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) {
        // Si l'erreur indique que la colonne n'existe pas, informer l'utilisateur
        if (error.message?.includes('column') && error.message?.includes('does not exist')) {
          alert('La fonctionnalité d\'activation/désactivation nécessite l\'exécution de la migration de base de données. Veuillez exécuter la migration: 20250122000000_add_is_active_to_users_and_providers.sql');
        } else {
          throw error;
        }
        return;
      }
      loadData();
    } catch (error: any) {
      console.error('Erreur activation/désactivation utilisateur:', error);
      alert('Erreur lors de la modification du statut: ' + (error.message || 'Erreur inconnue'));
    }
  };

  const handleToggleProviderActive = async (providerId: string, userId: string, currentStatus: boolean) => {
    try {
      // Mettre à jour le prestataire
      const { error: providerError } = await supabase
        .from('service_providers')
        .update({ is_active: !currentStatus })
        .eq('id', providerId);

      if (providerError) throw providerError;

      // Mettre à jour aussi le profil utilisateur si nécessaire
      const { error: userError } = await supabase
        .from('user_profiles')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (userError) throw userError;
      loadData();
    } catch (error) {
      console.error('Erreur activation/désactivation prestataire:', error);
      alert('Erreur lors de la modification du statut');
    }
  };

  const handleCancelReservation = async (reservationId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) return;
    
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ 
          status: 'cancelled',
          payment_status: 'refunded'
        })
        .eq('id', reservationId);

      if (error) throw error;
      loadData();
      alert('Réservation annulée avec succès');
    } catch (error: any) {
      console.error('Erreur annulation réservation:', error);
      alert('Erreur: ' + error.message);
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
            { id: 'properties', label: 'Propriétés', icon: Home },
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
            <StatCard
              icon={<DollarSign className="w-8 h-8 text-orange-600" />}
              title="Revenus services supplémentaires"
              value={`${stats.additionalServicesRevenue.toFixed(2)} €`}
              bgColor="bg-orange-50"
            />
            <StatCard
              icon={<DollarSign className="w-8 h-8 text-indigo-600" />}
              title="Revenus prestataires"
              value={`${stats.providerServicesRevenue.toFixed(2)} €`}
              bgColor="bg-indigo-50"
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

      {/* Recherche de propriétés */}
      {activeTab === 'properties' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Recherche de Propriétés</h3>
            <div className="flex space-x-4">
              <input
                type="text"
                placeholder="Rechercher par titre, adresse, hôte..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                onChange={async (e) => {
                  const searchTerm = e.target.value;
                  if (searchTerm.length > 2) {
                    try {
                      const { data: propertiesData, error } = await supabase
                        .from('properties')
                        .select(`
                          *,
                          owner:user_profiles!properties_owner_id_fkey(
                            id,
                            first_name,
                            last_name,
                            email,
                            phone,
                            user_type
                          )
                        `)
                        .or(`title.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
                        .limit(50);
                      
                      if (error) throw error;
                      setProperties(propertiesData || []);
                    } catch (error) {
                      console.error('Erreur recherche:', error);
                      setProperties([]);
                    }
                  } else if (searchTerm.length === 0) {
                    setProperties([]);
                  }
                }}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Propriété</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hôte</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix/nuit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {properties.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Aucune propriété trouvée. Commencez à taper pour rechercher...
                    </td>
                  </tr>
                ) : (
                  properties.map((property: any) => (
                  <tr key={property.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{property.title}</div>
                      <div className="text-sm text-gray-500">{property.address}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {property.owner?.first_name} {property.owner?.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{property.owner?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {property.owner?.phone || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {property.price_per_night} €
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        property.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {property.is_published ? 'Publiée' : 'Non publiée'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => navigate(`/property/${property.id}`)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Voir détails
                      </button>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Gestion des utilisateurs */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Gestion des Utilisateurs</h3>
            <div className="flex space-x-2">
              <button
                onClick={loadData}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
                title="Actualiser"
              >
                <span>🔄</span>
                <span>Actualiser</span>
              </button>
              <button
                onClick={handleExportUsers}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Exporter</span>
              </button>
            </div>
          </div>

          {usersError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-800">Erreur de chargement</p>
              <p className="text-sm text-red-600 mt-1">{usersError}</p>
              <p className="text-xs text-red-500 mt-2">
                Vérifiez la console du navigateur (F12) pour plus de détails. 
                Assurez-vous que le script SQL a été exécuté dans Supabase.
              </p>
            </div>
          )}
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Téléphone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date création</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center space-y-2">
                        <Users className="w-12 h-12 text-gray-400" />
                        <p className="text-sm font-medium">Aucun utilisateur trouvé</p>
                        <p className="text-xs text-gray-400">
                          Les utilisateurs apparaîtront ici une fois qu'ils auront créé un compte.
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          Vérifiez la console du navigateur (F12) pour voir les détails de chargement.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email || 'N/A'}</td>
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
                          user.user_type === 'partner' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.user_type === 'super_admin' ? 'Super Admin' : 
                           user.user_type === 'admin' ? 'Admin' :
                           user.user_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.phone || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          user.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active !== false ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowEditModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleUserActive(user.id, user.is_active !== false)}
                            className={user.is_active !== false ? "text-orange-600 hover:text-orange-900" : "text-green-600 hover:text-green-900"}
                            title={user.is_active !== false ? "Désactiver" : "Activer"}
                          >
                            {user.is_active !== false ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Réservations */}
      {activeTab === 'reservations' && (
        <div className="space-y-6">
          {/* Demandes d'annulation en attente */}
          {reservations.filter(r => r.status === 'pending_cancellation').length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-yellow-900 mb-4">
                Demandes d'annulation en attente ({reservations.filter(r => r.status === 'pending_cancellation').length})
              </h3>
              <div className="space-y-4">
                {reservations.filter(r => r.status === 'pending_cancellation').map(reservation => (
                  <div key={reservation.id} className="bg-white rounded-lg p-4 border border-yellow-300">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-semibold text-gray-900">
                          {reservation.property?.title || 'Propriété'}
                        </div>
                        <div className="text-sm text-gray-600">
                          Client: {reservation.guest?.first_name} {reservation.guest?.last_name}
                        </div>
                        <div className="text-sm text-gray-600">
                          Dates: {new Date(reservation.check_in).toLocaleDateString('fr-FR')} - {new Date(reservation.check_out).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="text-sm text-gray-600">
                          Montant: ${reservation.total_amount?.toFixed(2) || '0.00'}
                        </div>
                        {reservation.cancellation_reason && (
                          <div className="mt-2 text-sm text-gray-700">
                            <strong>Raison:</strong> {reservation.cancellation_reason}
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={async () => {
                            try {
                              const { error } = await supabase
                                .from('reservations')
                                .update({ 
                                  status: 'cancelled',
                                  payment_status: 'refunded'
                                })
                                .eq('id', reservation.id);
                              if (!error) {
                                loadData();
                                alert('Annulation approuvée et remboursement effectué');
                              } else {
                                alert('Erreur: ' + error.message);
                              }
                            } catch (error: any) {
                              alert('Erreur: ' + error.message);
                            }
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          Approuver
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const { error } = await supabase
                                .from('reservations')
                                .update({ 
                                  status: reservation.status === 'pending_cancellation' ? 'confirmed' : reservation.status
                                })
                                .eq('id', reservation.id);
                              if (!error) {
                                loadData();
                                alert('Demande d\'annulation refusée');
                              } else {
                                alert('Erreur: ' + error.message);
                              }
                            } catch (error: any) {
                              alert('Erreur: ' + error.message);
                            }
                          }}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                        >
                          Refuser
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <ReservationsList
              reservations={reservations}
              userType="admin"
              title="Toutes les réservations"
              onCancel={handleCancelReservation}
            />
          </div>
        </div>
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

      {/* Modal de modification d'utilisateur */}
      <EditUserModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedUser(null);
        }}
        onUserUpdated={() => {
          loadData();
        }}
        user={selectedUser}
      />
    </div>
  );
};

export default AdminDashboard;

