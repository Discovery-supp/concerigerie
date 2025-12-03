import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import StatCard from './StatCard';
import QuickActionCard from './QuickActionCard';
import ReservationsList from './ReservationsList';
import CalendarView from './CalendarView';
import ReviewsList from './ReviewsList';
import MessagingSystem from '../Forms/MessagingSystem';
import PerformanceStats from './PerformanceStats';
import HostEarnings from './HostEarnings';
import { Home, Calendar, DollarSign, Users, Settings, Package, MessageCircle, Star, TrendingUp, Bell, CheckCircle, Clock } from 'lucide-react';
import PropertyAvailabilityManager from './PropertyAvailabilityManager';
import { useToast } from '../../contexts/ToastContext';
import { messages } from '../../utils/messages';

interface OwnerDashboardProps {
  userId: string;
}

const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ userId }) => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'reservations' | 'calendar' | 'reviews' | 'messages' | 'stats' | 'payments' | 'properties' | 'settings'>('overview');
  const [reservations, setReservations] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [availabilityPropertyId, setAvailabilityPropertyId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    properties: 0,
    reservations: 0,
    revenue: 0,
    reviews: 0,
    occupancyRate: 0,
    monthlyRevenue: 0,
    previousMonthRevenue: 0
  });
  const [ownerSince, setOwnerSince] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    loadNotifications();
  }, [userId]);

  const loadData = async () => {
    try {
      // Récupérer l'utilisateur courant pour afficher depuis quand il est sur le site
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        // Gérer les erreurs 403 (Forbidden) - token invalide ou expiré
        if (userError) {
          if (userError.status === 403 || userError.message?.includes('Forbidden') || 
              userError.message?.includes('JWT') || userError.message?.includes('token')) {
            console.warn('[OwnerDashboard] Erreur d\'authentification (403), déconnexion...');
            try {
              localStorage.removeItem('supabase.auth.token');
              await supabase.auth.signOut();
            } catch (signOutError) {
              console.error('Erreur lors de la déconnexion:', signOutError);
            }
            window.location.href = '/login';
            return;
          }
          throw userError;
        }
        
        if (user?.created_at) {
          const createdAt = new Date(user.created_at);
          const formatted = createdAt.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
          });
          setOwnerSince(formatted);
        }
      } catch (err: any) {
        console.error('Erreur récupération date de création utilisateur:', err);
        // Si c'est une erreur 403, rediriger vers login
        if (err?.status === 403 || err?.message?.includes('Forbidden')) {
          window.location.href = '/login';
        }
      }

      // Charger les propriétés
      const { data: propertiesData } = await supabase
        .from('properties')
        .select('id, title, address, images, price_per_night, is_published')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

      const propertyIds = propertiesData?.map(p => p.id) || [];
      setProperties(propertiesData || []);

      // Charger les réservations avec détails complets
      // Utiliser LEFT JOIN au lieu de INNER JOIN pour ne pas perdre les réservations
      // si la propriété n'est plus accessible
      let reservationsData: any[] = [];
      
      // Charger les réservations sans jointures
      const { data: allReservations, error: resError } = await supabase
        .from('reservations')
        .select('*')
        .in('property_id', propertyIds)
        .order('check_in', { ascending: false });

      if (resError) {
        console.error('Erreur chargement réservations:', resError);
        reservationsData = [];
      } else {
        reservationsData = allReservations || [];
        
        // Charger les propriétés séparément
        if (reservationsData.length > 0) {
          const { data: propertiesData } = await supabase
            .from('properties')
            .select('id, title, address, images, owner_id')
            .in('id', propertyIds);

          if (propertiesData) {
            const propertiesMap = new Map(propertiesData.map(p => [p.id, p]));
            reservationsData = reservationsData.map((res: any) => ({
              ...res,
              property: propertiesMap.get(res.property_id) || null
            }));
          }
        }
        
        console.log('Réservations chargées:', reservationsData?.length || 0, 'pour', propertyIds.length, 'propriétés');
      }

      // Enrichir les réservations avec les profils des invités
      if (reservationsData && reservationsData.length > 0) {
        const guestIds = [...new Set(reservationsData.map(r => r.guest_id).filter(Boolean))];
        if (guestIds.length > 0) {
          const { data: guestProfiles, error: guestError } = await supabase
            .from('user_profiles')
            .select('id, first_name, last_name, phone')
            .in('id', guestIds);

          if (guestError) {
            console.error('Erreur chargement profils invités:', guestError);
          } else {
            // Fusionner les données
            const guestMap = new Map(guestProfiles?.map(g => [g.id, g]) || []);
            reservationsData.forEach(reservation => {
              reservation.guest = guestMap.get(reservation.guest_id);
            });
          }
        }
      }

      // Charger les avis sans jointures
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*')
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
      // Récupérer les IDs des propriétés de l'utilisateur
      const { data: userProperties } = await supabase
        .from('properties')
        .select('id')
        .eq('owner_id', userId);

      const propertyIds = userProperties?.map(p => p.id) || [];
      if (propertyIds.length === 0) {
        setNotifications([]);
        return;
      }

      // Charger les notifications (nouvelles réservations, rappels check-in/check-out)
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Charger les réservations sans jointures, filtrer par property_id
      const { data: allReservations } = await supabase
        .from('reservations')
        .select('*')
        .in('property_id', propertyIds)
        .in('status', ['confirmed', 'pending']);

      // Charger les propriétés pour enrichir
      const { data: propertiesData } = await supabase
        .from('properties')
        .select('id, owner_id, title')
        .in('id', propertyIds)
        .eq('owner_id', userId);

      const propertiesMap = new Map(propertiesData?.map(p => [p.id, p]) || []);

      // Filtrer et enrichir les réservations
      const upcomingCheckIns = (allReservations || []).filter((r: any) => {
        const prop = propertiesMap.get(r.property_id);
        return prop && r.status === 'confirmed' && 
          r.check_in >= today.toISOString().split('T')[0] &&
          r.check_in <= tomorrow.toISOString().split('T')[0];
      }).map((r: any) => ({ ...r, property: propertiesMap.get(r.property_id) }));

      const upcomingCheckOuts = (allReservations || []).filter((r: any) => {
        const prop = propertiesMap.get(r.property_id);
        return prop && r.status === 'confirmed' && 
          r.check_out >= today.toISOString().split('T')[0] &&
          r.check_out <= tomorrow.toISOString().split('T')[0];
      }).map((r: any) => ({ ...r, property: propertiesMap.get(r.property_id) }));

      const newReservations = (allReservations || []).filter((r: any) => {
        const prop = propertiesMap.get(r.property_id);
        return prop && r.status === 'pending';
      }).map((r: any) => ({ ...r, property: propertiesMap.get(r.property_id) }));

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
      // Récupérer les informations de la réservation avant la mise à jour
      const { data: reservation } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', reservationId)
        .single();

      if (!reservation) {
        throw new Error('Réservation introuvable');
      }

      // Charger la propriété séparément si nécessaire
      let property = null;
      if (reservation?.property_id) {
        const { data: propData } = await supabase
          .from('properties')
          .select('id, title')
          .eq('id', reservation.property_id)
          .maybeSingle();
        property = propData;
      }
      const reservationWithProperty = { ...reservation, property };

      // Mettre à jour la réservation
      const updateData = { 
        status: newStatus,
        updated_at: new Date().toISOString(),
        ...(newStatus === 'confirmed' && { payment_status: 'paid' })
      };

      console.log('[OwnerDashboard] Tentative de mise à jour réservation:', {
        reservationId,
        updateData,
        currentStatus: reservation.status,
        propertyId: reservation.property_id
      });

      const { data: updatedData, error: updateError } = await supabase
        .from('reservations')
        .update(updateData)
        .eq('id', reservationId)
        .select()
        .single();

      if (updateError) {
        console.error('[OwnerDashboard] Erreur mise à jour réservation:', {
          error: updateError,
          message: updateError.message,
          code: updateError.code,
          details: updateError.details,
          hint: updateError.hint
        });
        
        // Si c'est une erreur de permissions, afficher un message plus clair
        if (updateError.code === '42501' || updateError.message?.includes('policy') || updateError.message?.includes('permission')) {
          showError('Erreur de permissions: Vous n\'avez pas les droits pour modifier cette réservation. Vérifiez les politiques RLS dans Supabase.');
        } else {
          showError('Erreur lors de la mise à jour: ' + updateError.message);
        }
        throw updateError;
      }

      if (!updatedData) {
        console.error('[OwnerDashboard] Aucune donnée retournée après mise à jour');
        throw new Error('La mise à jour n\'a retourné aucune donnée');
      }

      console.log('[OwnerDashboard] Réservation mise à jour avec succès dans la DB:', {
        id: updatedData.id,
        status: updatedData.status,
        payment_status: updatedData.payment_status
      });

      // Vérifier immédiatement que la mise à jour a bien été persistée
      const { data: verifyData, error: verifyError } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', reservationId)
        .single();

      if (verifyError) {
        console.error('[OwnerDashboard] Erreur lors de la vérification immédiate:', verifyError);
      } else {
        console.log('[OwnerDashboard] Vérification immédiate - Statut dans la DB:', verifyData?.status);
        if (verifyData?.status !== newStatus) {
          console.error('[OwnerDashboard] PROBLÈME: Le statut dans la DB ne correspond pas!', {
            attendu: newStatus,
            obtenu: verifyData?.status
          });
          showError('Erreur: La mise à jour n\'a pas été persistée correctement dans la base de données. Vérifiez les politiques RLS.');
          return;
        }
      }

      // Utiliser les données retournées par la DB
      const finalReservation = updatedData || {
        ...reservation,
        status: newStatus,
        updated_at: new Date().toISOString(),
        ...(newStatus === 'confirmed' && { payment_status: 'paid' })
      };

      // Mettre à jour immédiatement l'état local avec la réservation mise à jour
      setReservations(prev => {
        const beforeCount = prev.filter(r => r.status === 'pending').length;
        const updated = prev.map(r => {
          if (r.id === reservationId) {
            const updatedRes = {
              ...r,
              ...finalReservation,
              property: property || r.property
            };
            console.log('[OwnerDashboard] Réservation mise à jour:', {
              id: reservationId,
              avant: r.status,
              après: updatedRes.status
            });
            return updatedRes;
          }
          return r;
        });
        const afterCount = updated.filter(r => r.status === 'pending').length;
        console.log('[OwnerDashboard] Réservations en attente: avant=', beforeCount, 'après=', afterCount);
        return updated;
      });

      // Si la réservation est confirmée, créer une notification pour le guest
      if (newStatus === 'confirmed' && reservation?.guest_id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: reservation.guest_id,
            type: 'reservation_confirmed',
            title: 'Réservation confirmée',
            message: `Votre réservation pour ${property?.title || reservation.property?.title || 'la propriété'} a été confirmée par l'hôte. Réservez maintenant !`,
            data: {
              reservation_id: reservationId,
              property_id: reservation.property_id
            },
            is_read: false
          });
        
        // Afficher un toast de succès pour l'hôte
        showSuccess(messages.success.reservationConfirmedByHost);
      } else if (newStatus === 'cancelled') {
        showSuccess('Réservation annulée avec succès.');
      }

      // Recharger seulement les notifications, pas toutes les données
      // La mise à jour locale est suffisante pour l'UI
      loadNotifications();
      
      // Vérifier que la mise à jour a bien été persistée après un délai
      // mais ne pas recharger toutes les données pour éviter d'écraser la mise à jour locale
      setTimeout(async () => {
        try {
          // Vérifier que la mise à jour a bien été persistée
          const { data: verifyReservation, error: verifyError } = await supabase
            .from('reservations')
            .select('*')
            .eq('id', reservationId)
            .maybeSingle();
          
          if (verifyError) {
            console.error('[OwnerDashboard] Erreur vérification réservation:', verifyError);
            return;
          }
          
          if (verifyReservation && verifyReservation.status === newStatus) {
            // La mise à jour est confirmée dans la DB
            console.log('[OwnerDashboard] Réservation vérifiée dans la DB:', verifyReservation.status);
            
            // Mettre à jour l'état local avec les données de la DB pour s'assurer de la cohérence
            setReservations(prev => {
              const current = prev.find(r => r.id === reservationId);
              // Ne mettre à jour que si le statut local n'est pas déjà correct
              if (current && current.status !== newStatus) {
                console.log('[OwnerDashboard] Correction du statut local depuis la DB');
                return prev.map(r => 
                  r.id === reservationId 
                    ? { ...r, ...verifyReservation, property: property || r.property }
                    : r
                );
              }
              return prev;
            });
          } else {
            console.warn('[OwnerDashboard] Statut dans la DB ne correspond pas:', verifyReservation?.status, 'attendu:', newStatus);
          }
        } catch (error) {
          console.error('[OwnerDashboard] Erreur lors de la vérification:', error);
        }
      }, 1000);

    } catch (error) {
      console.error('Erreur mise à jour réservation:', error);
      showError('Erreur lors de la mise à jour: ' + (error as any).message);
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
            { id: 'properties', label: 'Propriétés', icon: Home },
            { id: 'settings', label: 'Paramètres', icon: Settings, isLink: true, link: '/owner/settings' }
          ].map(tab => {
            const Icon = tab.icon;
            if ((tab as any).isLink && (tab as any).link) {
              return (
                <a
                  key={tab.id}
                  href={(tab as any).link}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap text-gray-600 hover:bg-gray-100"
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </a>
              );
            }
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
          {ownerSince && (
            <div className="bg-white rounded-xl shadow-md p-4 flex items-center space-x-2">
              <Clock className="w-5 h-5 text-gray-500" />
              <p className="text-sm text-gray-700">
                Hôte sur la plateforme depuis le <span className="font-medium">{ownerSince}</span>
              </p>
            </div>
          )}

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
              onClick={() => navigate('/manage-properties')}
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
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Gestion de la disponibilité</h3>
              <button
                onClick={() => navigate('/manage-properties')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Home className="w-4 h-4" />
                <span>Gérer toutes les propriétés</span>
              </button>
            </div>
            <p className="text-gray-600 mb-4">
              Sélectionnez une propriété pour bloquer/débloquer des dates manuellement ou visualisez toutes vos réservations.
            </p>
            
            {properties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {properties.map((property) => (
                  <div
                    key={property.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{property.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">{property.address}</p>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            property.is_published 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {property.is_published ? 'Publiée' : 'Non publiée'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setAvailabilityPropertyId(property.id)}
                      className="w-full px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center space-x-2 text-sm font-medium"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Gérer la disponibilité</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Vous n'avez pas encore de propriétés</p>
                <button
                  onClick={() => navigate('/add-property')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Créer une propriété
                </button>
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Vue d'ensemble du calendrier</h3>
            <CalendarView events={calendarEvents} />
          </div>
        </div>
      )}

      {/* Avis */}
      {activeTab === 'reviews' && (
        <ReviewsList reviews={reviews} />
      )}

      {/* Messages */}
      {activeTab === 'messages' && (
        <MessagingSystem userType="owner" />
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
      {activeTab === 'payments' && userId && (
        <HostEarnings hostId={userId} />
      )}

      {/* Propriétés */}
      {activeTab === 'properties' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Mes Propriétés</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => navigate('/manage-properties')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Home className="w-4 h-4" />
                <span>Gérer mes propriétés</span>
              </button>
              <button
                onClick={() => navigate('/add-property')}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors"
              >
                Ajouter une propriété
              </button>
            </div>
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
                        if (!confirm('Supprimer cette propriété ? Cette action est irréversible.')) return;
                        try {
                          const { error } = await supabase
                            .from('properties')
                            .delete()
                            .eq('id', property.id);
                          if (error) throw error;
                          loadData();
                        } catch (err) {
                          console.error('Erreur suppression:', err);
                          const wantsUnpublish = confirm(
                            "Suppression impossible (réservations/avis liés ou droits).\n" +
                            "Voulez-vous retirer la publication ?"
                          );
                          if (wantsUnpublish) {
                            try {
                              const { error: upErr } = await supabase
                                .from('properties')
                                .update({ is_published: false })
                                .eq('id', property.id);
                              if (upErr) throw upErr;
                              loadData();
                            } catch (e) {
                              alert("Impossible de dépublier. Essayez via Gérer les propriétés.");
                            }
                          }
                        }
                      }}
                      className="flex-1 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm"
                    >
                      Supprimer
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

      {/* Modal de gestion de disponibilité */}
      {availabilityPropertyId && (
        <PropertyAvailabilityManager
          propertyId={availabilityPropertyId}
          onClose={() => {
            setAvailabilityPropertyId(null);
            loadData(); // Recharger les données pour mettre à jour le calendrier
          }}
        />
      )}
    </div>
  );
};

export default OwnerDashboard;
