import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  Wrench, 
  Calendar, 
  DollarSign, 
  Star, 
  MessageCircle, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  MapPin,
  User,
  Phone,
  Mail,
  TrendingUp,
  BarChart3,
  Settings,
  Bell
} from 'lucide-react';

interface ServiceRequest {
  id: string;
  property_id: string;
  service_type: string;
  description: string;
  requested_date: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  estimated_duration: number;
  client_name?: string;
  client_phone?: string;
  client_email?: string;
  property_title?: string;
  property_address?: string;
  created_at: string;
}

interface CompletedService {
  id: string;
  service_type: string;
  completed_date: string;
  rating: number;
  review: string;
  client_name?: string;
  property_title?: string;
  total_amount: number;
}

interface ProviderStats {
  totalRequests: number;
  completedServices: number;
  totalEarnings: number;
  averageRating: number;
  pendingRequests: number;
  monthlyGrowth: number;
}

const ProviderDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [completedServices, setCompletedServices] = useState<CompletedService[]>([]);
  const [stats, setStats] = useState<ProviderStats>({
    totalRequests: 0,
    completedServices: 0,
    totalEarnings: 0,
    averageRating: 0,
    pendingRequests: 0,
    monthlyGrowth: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('requests');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Charger les demandes de service
      const { data: requestsData } = await supabase
        .from('service_requests')
        .select(`
          *,
          properties!service_requests_property_id_fkey(title, address),
          user_profiles!service_requests_client_id_fkey(first_name, last_name, email, phone)
        `)
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false });

      setServiceRequests(requestsData || []);

      // Charger les services complétés
      const { data: completedData } = await supabase
        .from('completed_services')
        .select(`
          *,
          properties!completed_services_property_id_fkey(title),
          user_profiles!completed_services_client_id_fkey(first_name, last_name)
        `)
        .eq('provider_id', user.id)
        .order('completed_date', { ascending: false });

      setCompletedServices(completedData || []);

      // Calculer les statistiques
      calculateStats(requestsData || [], completedData || []);

    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (requests: ServiceRequest[], completed: CompletedService[]) => {
    const pendingRequests = requests.filter(r => r.status === 'pending').length;
    const completedServices = completed.length;
    const totalEarnings = completed.reduce((sum, s) => sum + s.total_amount, 0);
    const averageRating = completed.length > 0 
      ? completed.reduce((sum, s) => sum + s.rating, 0) / completed.length 
      : 0;

    setStats({
      totalRequests: requests.length,
      completedServices,
      totalEarnings,
      averageRating,
      pendingRequests,
      monthlyGrowth: 12.5 // À calculer avec les données historiques
    });
  };

  const updateRequestStatus = async (requestId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('service_requests')
        .update({ status: newStatus })
        .eq('id', requestId);

      if (error) throw error;

      setServiceRequests(prev =>
        prev.map(r => r.id === requestId ? { ...r, status: newStatus as any } : r)
      );
    } catch (error) {
      console.error('Erreur mise à jour:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'in_progress': return <Clock className="w-4 h-4" />;
      case 'accepted': return <AlertCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'cancelled': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRequests = serviceRequests.filter(request => {
    if (selectedTab === 'pending') return request.status === 'pending';
    if (selectedTab === 'accepted') return request.status === 'accepted';
    if (selectedTab === 'in_progress') return request.status === 'in_progress';
    if (selectedTab === 'completed') return request.status === 'completed';
    return true;
  });

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
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord Prestataire</h1>
        <p className="text-gray-600 mt-1">Gérez vos services et interventions</p>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<Wrench className="w-8 h-8 text-blue-600" />}
          title="Demandes totales"
          value={stats.totalRequests}
          subtitle={`${stats.pendingRequests} en attente`}
          bgColor="bg-blue-50"
        />
        <StatCard
          icon={<CheckCircle className="w-8 h-8 text-green-600" />}
          title="Services complétés"
          value={stats.completedServices}
          subtitle="Cette année"
          bgColor="bg-green-50"
        />
        <StatCard
          icon={<DollarSign className="w-8 h-8 text-yellow-600" />}
          title="Gains totaux"
          value={`€${stats.totalEarnings.toFixed(2)}`}
          subtitle={`+${stats.monthlyGrowth}% ce mois`}
          bgColor="bg-yellow-50"
        />
        <StatCard
          icon={<Star className="w-8 h-8 text-purple-600" />}
          title="Note moyenne"
          value={stats.averageRating.toFixed(1)}
          subtitle="Basée sur les avis clients"
          bgColor="bg-purple-50"
        />
      </div>

      {/* Navigation par onglets */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'requests', label: 'Demandes', icon: Wrench },
            { id: 'pending', label: 'En attente', icon: Clock },
            { id: 'accepted', label: 'Acceptées', icon: CheckCircle },
            { id: 'in_progress', label: 'En cours', icon: AlertCircle },
            { id: 'completed', label: 'Terminées', icon: CheckCircle },
            { id: 'calendar', label: 'Calendrier', icon: Calendar },
            { id: 'messages', label: 'Messages', icon: MessageCircle }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                selectedTab === tab.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Contenu des onglets */}
      {selectedTab === 'requests' && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Toutes les demandes</h2>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <Wrench className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune demande</h3>
              <p className="text-gray-600">Les nouvelles demandes apparaîtront ici</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <ServiceRequestCard 
                  key={request.id} 
                  request={request} 
                  onStatusUpdate={updateRequestStatus}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {selectedTab === 'calendar' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Calendrier des interventions</h2>
            <div className="flex items-center space-x-4">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Ajouter disponibilité
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-4 mb-6">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
            {/* Ici vous pourriez ajouter un calendrier complet */}
            <div className="col-span-7 text-center py-8 text-gray-500">
              Calendrier des interventions à implémenter
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'messages' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Messages</h2>
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun message</h3>
            <p className="text-gray-600">Communiquez avec les clients et l'administration</p>
          </div>
        </div>
      )}

      {/* Actions rapides */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionCard
            title="Mettre à jour le profil"
            description="Gérer vos compétences et disponibilités"
            icon={<User className="w-6 h-6" />}
            color="blue"
            onClick={() => navigate('/profile')}
          />
          <QuickActionCard
            title="Voir les statistiques"
            description="Analyses de performance"
            icon={<BarChart3 className="w-6 h-6" />}
            color="green"
            onClick={() => navigate('/analytics')}
          />
          <QuickActionCard
            title="Paramètres"
            description="Configuration du compte"
            icon={<Settings className="w-6 h-6" />}
            color="purple"
            onClick={() => navigate('/settings')}
          />
          <QuickActionCard
            title="Support"
            description="Aide et assistance"
            icon={<Bell className="w-6 h-6" />}
            color="orange"
            onClick={() => navigate('/support')}
          />
        </div>
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

const ServiceRequestCard: React.FC<{
  request: ServiceRequest;
  onStatusUpdate: (id: string, status: string) => void;
}> = ({ request, onStatusUpdate }) => (
  <div className="bg-white rounded-lg shadow-sm border p-6">
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <div className="flex items-center space-x-3 mb-2">
          <h3 className="text-lg font-medium text-gray-900">{request.service_type}</h3>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
            {getStatusIcon(request.status)}
            <span className="ml-1">{request.status}</span>
          </span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
            {request.priority}
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-2">{request.description}</p>
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <MapPin className="w-4 h-4" />
            <span>{request.property_title}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>{new Date(request.requested_date).toLocaleDateString('fr-FR')}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{request.estimated_duration}h</span>
          </div>
        </div>
      </div>
    </div>
    
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4 text-sm text-gray-600">
        <div className="flex items-center space-x-1">
          <User className="w-4 h-4" />
          <span>{request.client_name || 'Client'}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Phone className="w-4 h-4" />
          <span>{request.client_phone || 'N/A'}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Mail className="w-4 h-4" />
          <span>{request.client_email || 'N/A'}</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        {request.status === 'pending' && (
          <>
            <button
              onClick={() => onStatusUpdate(request.id, 'accepted')}
              className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
            >
              Accepter
            </button>
            <button
              onClick={() => onStatusUpdate(request.id, 'cancelled')}
              className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
            >
              Refuser
            </button>
          </>
        )}
        {request.status === 'accepted' && (
          <button
            onClick={() => onStatusUpdate(request.id, 'in_progress')}
            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            Commencer
          </button>
        )}
        {request.status === 'in_progress' && (
          <button
            onClick={() => onStatusUpdate(request.id, 'completed')}
            className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
          >
            Terminer
          </button>
        )}
      </div>
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

export default ProviderDashboard;

