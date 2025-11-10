import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import StatCard from './StatCard';
import QuickActionCard from './QuickActionCard';
import CalendarView from './CalendarView';
import MessagingSystem from '../Forms/MessagingSystem';
import { Wrench, Calendar, MessageCircle, Star, TrendingUp, CheckCircle, Clock } from 'lucide-react';

interface ProviderDashboardProps {
  userId: string;
}

interface ServiceRequest {
  id: string;
  property_id: string;
  property?: {
    title: string;
    address: string;
  };
  service_type: string;
  requested_date: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  description?: string;
}

const ProviderDashboard: React.FC<ProviderDashboardProps> = ({ userId }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'history' | 'calendar' | 'messages' | 'stats'>('overview');
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [completedServices, setCompletedServices] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalServices: 0,
    pendingRequests: 0,
    completedServices: 0,
    averageRating: 0,
    totalEarnings: 0
  });

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      // Charger le profil prestataire
      const { data: providerProfile } = await supabase
        .from('service_providers')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Pour cet exemple, on simule les demandes de service
      // Dans une vraie app, vous auriez une table service_requests
      const pendingRequests: ServiceRequest[] = [];
      const completed: ServiceRequest[] = [];

      setRequests(pendingRequests);
      setCompletedServices(completed);

      setStats({
        totalServices: providerProfile?.completed_jobs || 0,
        pendingRequests: pendingRequests.length,
        completedServices: completed.length,
        averageRating: providerProfile?.rating || 0,
        totalEarnings: 0
      });
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const calendarEvents = requests
    .filter(r => r.status === 'confirmed')
    .map(r => ({
      id: r.id,
      date: r.requested_date,
      title: `${r.service_type} - ${r.property?.title || 'Propriété'}`,
      type: 'reservation' as const
    }));

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Navigation par onglets */}
      <div className="bg-white rounded-xl shadow-md p-1">
        <div className="flex space-x-1 overflow-x-auto">
          {[
            { id: 'overview', label: 'Vue d\'ensemble', icon: Wrench },
            { id: 'requests', label: 'Demandes', icon: Clock },
            { id: 'history', label: 'Historique', icon: CheckCircle },
            { id: 'calendar', label: 'Calendrier', icon: Calendar },
            { id: 'messages', label: 'Messages', icon: MessageCircle },
            { id: 'stats', label: 'Statistiques', icon: TrendingUp }
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              icon={<Wrench className="w-8 h-8 text-blue-600" />}
              title="Missions complétées"
              value={stats.totalServices}
              bgColor="bg-blue-50"
            />
            <StatCard
              icon={<Clock className="w-8 h-8 text-green-600" />}
              title="Demandes en attente"
              value={stats.pendingRequests}
              bgColor="bg-green-50"
            />
            <StatCard
              icon={<Star className="w-8 h-8 text-yellow-600" />}
              title="Note moyenne"
              value={stats.averageRating.toFixed(1)}
              bgColor="bg-yellow-50"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <QuickActionCard
              title="Nouvelles demandes"
              description={`${stats.pendingRequests} demande(s) en attente`}
              icon={<Clock className="w-6 h-6" />}
              onClick={() => setActiveTab('requests')}
              color="blue"
            />
            <QuickActionCard
              title="Mon profil"
              description="Gérer mes compétences"
              icon={<Settings className="w-6 h-6" />}
              onClick={() => navigate('/become-provider')}
              color="gray"
            />
            <QuickActionCard
              title="Paramètres du compte"
              description="Modifier mes informations"
              icon={<Settings className="w-6 h-6" />}
              onClick={() => navigate('/settings')}
              color="blue"
            />
          </div>
        </>
      )}

      {/* Demandes de service */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Demandes de Service</h3>
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucune demande de service pour le moment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map(request => (
                <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{request.service_type}</h4>
                      <p className="text-sm text-gray-600">{request.property?.title}</p>
                      <p className="text-sm text-gray-500">{request.property?.address}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      request.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {request.status === 'pending' ? 'En attente' : request.status === 'confirmed' ? 'Confirmée' : 'Terminée'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(request.requested_date).toLocaleDateString('fr-FR')}</span>
                  </div>
                  {request.description && (
                    <p className="mt-3 text-gray-700">{request.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Historique */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Historique des Prestations</h3>
          {completedServices.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucun service complété pour le moment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {completedServices.map(service => (
                <div key={service.id} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900">{service.service_type}</h4>
                  <p className="text-sm text-gray-600">{service.property?.title}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Calendrier */}
      {activeTab === 'calendar' && (
        <CalendarView events={calendarEvents} />
      )}

      {/* Messages */}
      {activeTab === 'messages' && (
        <MessagingSystem userType="provider" />
      )}

      {/* Statistiques */}
      {activeTab === 'stats' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Statistiques de Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Nombre total de services</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalServices}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Note moyenne</p>
              <p className="text-3xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}/5</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProviderDashboard;

