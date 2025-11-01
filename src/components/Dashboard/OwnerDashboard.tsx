import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import StatCard from './StatCard';
import QuickActionCard from './QuickActionCard';
import ReservationsList from './ReservationsList';
import CalendarView from './CalendarView';
import ReviewsList from './ReviewsList';
import MessageBox from './MessageBox';
import PerformanceStats from './PerformanceStats';
import PaymentReports from './PaymentReports';
import { Home, Calendar, DollarSign, Users, Settings, Package, MessageCircle, Star, TrendingUp, Bell, CheckCircle, Clock } from 'lucide-react';

interface OwnerDashboardProps {
  userId: string;
}

const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ userId }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'reservations' | 'calendar' | 'reviews' | 'messages' | 'stats' | 'payments' | 'properties'>('overview');
  const [reservations, setReservations] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    properties: 0,
    reservations: 0,
    revenue: 0,
    reviews: 0,
    occupancyRate: 0,
    monthlyRevenue: 0,
    previousMonthRevenue: 0
  });

  useEffect(() => {
    loadData();
    loadNotifications();
  }, [userId]);

  const loadData = async () => {
    try {
      // Charger les propriétés
      const { data: propertiesData } = await supabase
        .from('properties')
        .select('id, title, address, images, price_per_night, is_published')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

      const propertyIds = propertiesData?.map(p => p.id) || [];
      setProperties(propertiesData || []);

      // Charger les réservations avec détails complets
      const { data: reservationsData, error: resError } = await supabase
        .from('reservations')
        .select(`
          *,
          property:properties(id, title, address, images),
          guest:user_profiles!reservations_guest_id_fkey(id, first_name, last_name, email, phone)
        `)
        .in('property_id', propertyIds)
        .order('check_in', { ascending: false });

      if (resError) throw resError;

      // Charger les avis
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select(`
          *,
          property:properties(id, title),
          guest:user_profiles!reviews_guest_id_fkey(id, first_name, last_name)
        `)
        .in('property_id', propertyIds)
        .order('created_at', { ascending: false })
        .limit(10);

      setReviews(reviewsData || []);

      // Calculer les statistiques
      const totalRevenue = reservationsData?.reduce((sum, r) => sum + Number(r.total_amount || 0), 0) || 0;
      const activeReservations = reservationsData?.filter(r => r.status === 'confirmed').length || 0;
      
      // Calculer le revenu mensuel (mois actuel)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyRevenue = reservationsData?.filter(r => {
        const date = new Date(r.created_at);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      }).reduce((sum, r) => sum + Number(r.total_amount || 0), 0) || 0;

      // Revenu du mois précédent
      const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const previousMonthRevenue = reservationsData?.filter(r => {
        const date = new Date(r.created_at);
        return date.getMonth() === previousMonth && date.getFullYear() === previousYear;
      }).reduce((sum, r) => sum + Number(r.total_amount || 0), 0) || 0;

      // Taux d'occupation (simplifié: réservations confirmées / propriétés)
      const occupancyRate = propertyIds.length > 0 
        ? (activeReservations / propertyIds.length) * 100 
        : 0;

      setStats({
        properties: propertiesData?.length || 0,
        reservations: reservationsData?.length || 0,
        revenue: totalRevenue,
        reviews: reviewsData?.length || 0,
        occupancyRate,
        monthlyRevenue,
        previousMonthRevenue
      });

      setReservations(reservationsData || []);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      // Charger les notifications (nouvelles réservations, rappels check-in/check-out)
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: upcomingCheckIns } = await supabase
        .from('reservations')
        .select('*, property:properties!inner(owner_id, title)')
        .eq('properties.owner_id', userId)
        .eq('status', 'confirmed')
        .gte('check_in', today.toISOString().split('T')[0])
        .lte('check_in', tomorrow.toISOString().split('T')[0]);

      const { data: upcomingCheckOuts } = await supabase
        .from('reservations')
        .select('*, property:properties!inner(owner_id, title)')
        .eq('properties.owner_id', userId)
        .eq('status', 'confirmed')
        .gte('check_out', today.toISOString().split('T')[0])
        .lte('check_out', tomorrow.toISOString().split('T')[0]);

      const { data: newReservations } = await supabase
        .from('reservations')
        .select('*, property:properties!inner(owner_id, title)')
        .eq('properties.owner_id', userId)
        .eq('status', 'pending');

      const notificationsList = [
        ...(newReservations || []).map((r: any) => ({
          id: `new-${r.id}`,
          type: 'new_reservation',
          title: 'Nouvelle réservation',
          message: `Nouvelle réservation pour ${r.property?.title}`,
          date: r.created_at,
          reservation: r
        })),
        ...(upcomingCheckIns || []).map((r: any) => ({
          id: `checkin-${r.id}`,
          type: 'checkin_reminder',
          title: 'Rappel Check-in',
          message: `Check-in prévu demain pour ${r.property?.title}`,
          date: r.check_in,
          reservation: r
        })),
        ...(upcomingCheckOuts || []).map((r: any) => ({
          id: `checkout-${r.id}`,
          type: 'checkout_reminder',
          title: 'Rappel Check-out',
          message: `Check-out prévu demain pour ${r.property?.title}`,
          date: r.check_out,
          reservation: r
        }))
      ];

      setNotifications(notificationsList.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ));
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    }
  };

  const handleStatusChange = async (reservationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: newStatus })
        .eq('id', reservationId);

      if (error) throw error;
      loadData();
      loadNotifications();
    } catch (error) {
      console.error('Erreur mise à jour réservation:', error);
    }
  };

  const calendarEvents = reservations
    .filter(r => r.status === 'confirmed' || r.status === 'pending')
    .flatMap(r => [
      {
        id: `${r.id}-checkin`,
        date: r.check_in,
        title: `Check-in: ${r.property?.title || 'Propriété'}`,
        type: 'check-in' as const
      },
      {
        id: `${r.id}-checkout`,
        date: r.check_out,
        title: `Check-out: ${r.property?.title || 'Propriété'}`,
        type: 'check-out' as const
      }
    ]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation par onglets */}
      <div className="bg-white rounded-xl shadow-md p-1">
        <div className="flex space-x-1 overflow-x-auto">
          {[
            { id: 'overview', label: 'Vue d\'ensemble', icon: Home },
            { id: 'reservations', label: 'Réservations', icon: Calendar },
            { id: 'calendar', label: 'Calendrier', icon: Calendar },
            { id: 'reviews', label: 'Avis', icon: Star },
            { id: 'messages', label: 'Messages', icon: MessageCircle },
            { id: 'stats', label: 'Statistiques', icon: TrendingUp },
            { id: 'payments', label: 'Revenus', icon: DollarSign },
            { id: 'properties', label: 'Propriétés', icon: Home }
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

      {/* Notifications */}
      {notifications.length > 0 && activeTab === 'overview' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Bell className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-blue-900">Notifications ({notifications.length})</h4>
          </div>
          <div className="space-y-2">
            {notifications.slice(0, 3).map(notif => (
              <div key={notif.id} className="flex items-start space-x-2 text-sm">
                <div className={`w-2 h-2 rounded-full mt-1.5 ${
                  notif.type === 'new_reservation' ? 'bg-green-500' :
                  notif.type === 'checkin_reminder' ? 'bg-blue-500' :
                  'bg-orange-500'
                }`}></div>
                <div>
                  <p className="font-medium text-gray-900">{notif.title}</p>
                  <p className="text-gray-600">{notif.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vue d'ensemble */}
      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={<Home className="w-8 h-8 text-blue-600" />}
              title="Propriétés"
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
              title="Revenus totaux"
              value={`${stats.revenue.toFixed(2)} €`}
              bgColor="bg-yellow-50"
            />
            <StatCard
              icon={<TrendingUp className="w-8 h-8 text-purple-600" />}
              title="Taux d'occupation"
              value={`${stats.occupancyRate.toFixed(1)}%`}
              bgColor="bg-purple-50"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <QuickActionCard
              title="Gérer mes propriétés"
              description="Voir et modifier vos propriétés"
              icon={<Home className="w-6 h-6" />}
              onClick={() => setActiveTab('properties')}
              color="blue"
            />
            <QuickActionCard
              title="Nouvelles réservations"
              description={`${reservations.filter(r => r.status === 'pending').length} en attente`}
              icon={<Calendar className="w-6 h-6" />}
              onClick={() => setActiveTab('reservations')}
              color="green"
            />
            <QuickActionCard
              title="Ajouter une propriété"
              description="Créer une nouvelle annonce"
              icon={<Package className="w-6 h-6" />}
              onClick={() => navigate('/add-property')}
              color="orange"
            />
            <QuickActionCard
              title="Messagerie"
              description={`${notifications.length} notification(s)`}
              icon={<MessageCircle className="w-6 h-6" />}
              onClick={() => setActiveTab('messages')}
              color="purple"
            />
          </div>

          {/* Réservations récentes */}
          <ReservationsList
            reservations={reservations.slice(0, 5)}
            userType="owner"
            title="Réservations récentes"
            showFilters={false}
            onStatusChange={handleStatusChange}
          />
        </>
      )}

      {/* Réservations */}
      {activeTab === 'reservations' && (
        <ReservationsList
          reservations={reservations}
          userType="owner"
          title="Toutes les réservations"
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Calendrier */}
      {activeTab === 'calendar' && (
        <CalendarView events={calendarEvents} />
      )}

      {/* Avis */}
      {activeTab === 'reviews' && (
        <ReviewsList reviews={reviews} />
      )}

      {/* Messages */}
      {activeTab === 'messages' && (
        <MessageBox userId={userId} userType="owner" />
      )}

      {/* Statistiques */}
      {activeTab === 'stats' && (
        <PerformanceStats
          occupancyRate={stats.occupancyRate}
          revenue={stats.revenue}
          monthlyRevenue={stats.monthlyRevenue}
          previousMonthRevenue={stats.previousMonthRevenue}
          totalReservations={stats.reservations}
          totalProperties={stats.properties}
        />
      )}

      {/* Revenus / Paiements */}
      {activeTab === 'payments' && (
        <PaymentReports userId={userId} userType="owner" />
      )}

      {/* Propriétés */}
      {activeTab === 'properties' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Mes Propriétés</h3>
            <button
              onClick={() => navigate('/add-property')}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors"
            >
              Ajouter une propriété
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map(property => {
              const isPublished = property.is_published !== false;
              
              return (
                <div
                  key={property.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="relative">
                    <img
                      src={(() => {
                        if (!property.images || property.images.length === 0) {
                          return 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg';
                        }
                        const img = Array.isArray(property.images) ? property.images[0] : property.images;
                        if (typeof img === 'string') {
                          if (img.startsWith('data:') || img.startsWith('http')) {
                            return img;
                          }
                          try {
                            const parsed = JSON.parse(img);
                            return Array.isArray(parsed) ? parsed[0] : img;
                          } catch {
                            return img;
                          }
                        }
                        return 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg';
                      })()}
                      alt={property.title}
                      className="w-full h-48 object-cover rounded-lg mb-3 cursor-pointer"
                      onClick={() => navigate(`/property/${property.id}`)}
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg';
                      }}
                    />
                    <span className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
                      isPublished 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {isPublished ? 'Publiée' : 'Non publiée'}
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">{property.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{property.address}</p>
                  <p className="text-lg font-bold text-primary mb-3">{property.price_per_night} €/nuit</p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => navigate(`/property/${property.id}`)}
                      className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      Voir
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const { error } = await supabase
                            .from('properties')
                            .update({ is_published: !isPublished })
                            .eq('id', property.id);
                          
                          if (error) throw error;
                          loadData();
                        } catch (error) {
                          console.error('Erreur publication:', error);
                          alert('Erreur lors de la publication');
                        }
                      }}
                      className={`flex-1 px-3 py-2 rounded-lg transition-colors text-sm ${
                        isPublished
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {isPublished ? 'Dépublier' : 'Publier'}
                    </button>
                  </div>
                </div>
              );
            })}
            {properties.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Aucune propriété pour le moment</p>
                <button
                  onClick={() => navigate('/add-property')}
                  className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors"
                >
                  Ajouter ma première propriété
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerDashboard;
