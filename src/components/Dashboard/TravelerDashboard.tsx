import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import reservationsService from '../../services/reservations';
import reviewsService from '../../services/reviews';
import ReservationsList from './ReservationsList';
import StatCard from './StatCard';
import QuickActionCard from './QuickActionCard';
import MessagingSystem from '../Forms/MessagingSystem';
import ReviewsList from './ReviewsList';
import { Calendar, ExternalLink, MessageCircle, User, Home, Clock, Star, Phone, Mail, MapPin, Save, AlertCircle, Camera } from 'lucide-react';

interface TravelerDashboardProps {
  userId: string;
}

const TravelerDashboard: React.FC<TravelerDashboardProps> = ({ userId }) => {
  const navigate = useNavigate();
  const [allReservations, setAllReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'reservations' | 'reviews' | 'messages' | 'profile'>('overview');
  const [stats, setStats] = useState({
    totalReservations: 0,
    upcomingReservations: 0,
    pastReservations: 0
  });
  const [myReviews, setMyReviews] = useState<any[]>([]);
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    address: '',
    avatar_url: ''
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let pollId: number | undefined;
    
    const setupData = async () => {
      cleanup = await loadData();
      // Fallback polling toutes les 30s si Realtime indisponible
      pollId = window.setInterval(() => {
        loadData();
      }, 30000) as unknown as number;
    };
    
    setupData();
    
    return () => {
      if (cleanup) cleanup();
      if (pollId) window.clearInterval(pollId);
    };
  }, [userId]);

  const loadData = async (): Promise<(() => void) | undefined> => {
    try {
      // Charger toutes les réservations (historique complet) via le service
      const reservationsData = await reservationsService.getUserReservations(userId);
      
      console.log('[TravelerDashboard] Réservations chargées:', reservationsData?.length || 0);
      const safeReservations = Array.isArray(reservationsData) ? reservationsData : [];
      setAllReservations(safeReservations);

      // Calcul des statistiques simples
      const today = new Date().toISOString().split('T')[0];
      const upcoming = safeReservations.filter((r: any) => r.check_in >= today);
      const past = safeReservations.filter((r: any) => r.check_out < today);

      setStats({
        totalReservations: safeReservations.length,
        upcomingReservations: upcoming.length,
        pastReservations: past.length
      });

      // Charger les avis laissés par le voyageur
      const reviewsData = await reviewsService.getUserReviews(userId);
      setMyReviews(Array.isArray(reviewsData) ? reviewsData : []);

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('first_name,last_name,email,phone,country,city,address,avatar_url')
        .eq('id', userId)
        .single();

      if (profile) {
        setProfileData({
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          country: profile.country || '',
          city: profile.city || '',
          address: profile.address || '',
          avatar_url: profile.avatar_url || ''
        });
      }

      // S'abonner aux changements de réservations en temps réel
      const reservationChannel = supabase
        .channel(`traveler-reservations-${userId}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'reservations',
            filter: `guest_id=eq.${userId}`
          },
          (payload) => {
            console.log('Changement de réservation:', payload);
            loadData(); // Recharger les réservations
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(reservationChannel);
      };
    } catch (error) {
      console.error('Erreur chargement données:', error);
      return undefined;
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    setProfileSaving(true);

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          phone: profileData.phone,
          country: profileData.country,
          city: profileData.city,
          address: profileData.address
        })
        .eq('id', userId);

      if (error) throw error;

      setProfileMessage({
        type: 'success',
        text: 'Profil mis à jour avec succès.'
      });
      setTimeout(() => setProfileMessage(null), 3000);
    } catch (err) {
      console.error('Erreur mise à jour profil voyageur:', err);
      setProfileMessage({
        type: 'error',
        text: 'Impossible de mettre à jour le profil pour le moment.'
      });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setProfileMessage({
        type: 'error',
        text: 'La photo doit faire moins de 5 Mo.'
      });
      return;
    }

    setAvatarUploading(true);
    setProfileMessage(null);

    try {
      const ext = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${ext}`;
      const filePath = `profiles/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          contentType: file.type
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      setProfileData(prev => ({ ...prev, avatar_url: publicUrl }));
      setProfileMessage({
        type: 'success',
        text: 'Photo de profil mise à jour.'
      });
      setTimeout(() => setProfileMessage(null), 3000);
    } catch (err) {
      console.error('Erreur upload avatar:', err);
      setProfileMessage({
        type: 'error',
        text: 'Impossible de mettre à jour la photo pour le moment.'
      });
    } finally {
      setAvatarUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Chargement de l'historique des réservations...</p>
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
            { id: 'reservations', label: 'Mes réservations', icon: Calendar },
            { id: 'reviews', label: 'Mes avis', icon: Star },
            { id: 'messages', label: 'Messages', icon: MessageCircle },
            { id: 'profile', label: 'Mon profil', icon: User }
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Calendar className="w-6 h-6 mr-2 text-primary" />
                Bienvenue sur votre espace voyageur
              </h2>
              <p className="text-gray-600 mt-1">
                Retrouvez vos séjours, vos prochaines arrivées et contactez l&apos;administration si besoin.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard
              icon={<Calendar className="w-8 h-8 text-blue-600" />}
              title="Toutes mes réservations"
              value={stats.totalReservations}
              bgColor="bg-blue-50"
            />
            <StatCard
              icon={<Clock className="w-8 h-8 text-green-600" />}
              title="Séjours à venir"
              value={stats.upcomingReservations}
              bgColor="bg-green-50"
            />
            <StatCard
              icon={<Calendar className="w-8 h-8 text-gray-600" />}
              title="Séjours passés"
              value={stats.pastReservations}
              bgColor="bg-gray-50"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <QuickActionCard
              title="Voir toutes mes réservations"
              description="Consulter le détail de mes séjours"
              icon={<Calendar className="w-6 h-6" />}
              onClick={() => setActiveTab('reservations')}
              color="blue"
            />
            <QuickActionCard
              title="Contacter l'administration"
              description="Envoyer un message à l'équipe"
              icon={<MessageCircle className="w-6 h-6" />}
              onClick={() => setActiveTab('messages')}
              color="purple"
            />
            <QuickActionCard
              title="Réserver un nouveau séjour"
              description="Découvrir les propriétés disponibles"
              icon={<Home className="w-6 h-6" />}
              onClick={() => navigate('/properties?from=dashboard')}
              color="green"
            />
          </div>
        </>
      )}

      {/* Réservations */}
      {activeTab === 'reservations' && (
        <>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Calendar className="w-6 h-6 mr-2 text-primary" />
                Mes réservations
              </h2>
              <p className="text-gray-600 mt-1">
                Consultez toutes vos réservations passées et à venir.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/my-reservations"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Voir la page détaillée
              </Link>
              <button
                onClick={() => navigate('/properties?from=dashboard')}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors"
              >
                Nouvelle réservation
              </button>
            </div>
          </div>

          <ReservationsList
            reservations={allReservations}
            userType="traveler"
            title="Toutes mes réservations"
          />
        </>
      )}

      {/* Messages */}
      {activeTab === 'messages' && (
        <MessagingSystem userType="traveler" />
      )}

      {/* Avis */}
      {activeTab === 'reviews' && (
        <>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Star className="w-6 h-6 mr-2 text-primary" />
                Mes avis
              </h2>
              <p className="text-gray-600 mt-1">
                Consultez vos avis existants ou laissez un commentaire après votre séjour.
              </p>
            </div>
            <button
              onClick={() => navigate('/reviews')}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors flex items-center gap-2"
            >
              <Star className="w-4 h-4" />
              <span>Laisser un commentaire</span>
            </button>
          </div>

          <ReviewsList
            reviews={myReviews}
            title="Mes avis sur les séjours"
          />
        </>
      )}

      {/* Profil */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <User className="w-6 h-6 mr-2 text-primary" />
                Mon profil voyageur
              </h2>
              <p className="text-gray-600">
                Mettez à jour vos coordonnées pour simplifier vos prochaines réservations.
              </p>
            </div>
            <button
              onClick={() => navigate('/settings')}
              className="text-sm text-primary hover:text-primary-light underline"
            >
              Ouvrir la page paramètres
            </button>
          </div>

          {profileMessage && (
            <div
              className={`mb-4 flex items-center px-4 py-3 rounded-lg border ${
                profileMessage.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {profileMessage.type === 'success' ? (
                <Save className="w-4 h-4 mr-2" />
              ) : (
                <AlertCircle className="w-4 h-4 mr-2" />
              )}
              {profileMessage.text}
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                {profileData.avatar_url ? (
                  <img
                    src={profileData.avatar_url}
                    alt="Avatar voyageur"
                    className="w-20 h-20 rounded-full object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center border border-dashed border-gray-300 text-gray-500">
                    <User className="w-8 h-8" />
                  </div>
                )}
                <label className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-2 cursor-pointer hover:bg-primary-light transition-colors">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={avatarUploading}
                  />
                </label>
              </div>
              <div>
                <p className="text-sm text-gray-700 font-medium">Photo de profil</p>
                <p className="text-xs text-gray-500">
                  Formats acceptés : JPG, PNG (max 5 Mo). Cliquez sur l’icône appareil pour modifier.
                </p>
                {avatarUploading && (
                  <p className="text-xs text-primary mt-1">Téléchargement en cours...</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations de base</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    Prénom *
                  </label>
                  <input
                    type="text"
                    value={profileData.first_name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, first_name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    Nom *
                  </label>
                  <input
                    type="text"
                    value={profileData.last_name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, last_name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Mail className="w-4 h-4 mr-1" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Contactez l’administration pour changer votre email.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Phone className="w-4 h-4 mr-1" />
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="+243 ..."
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                Adresse et localisation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pays</label>
                  <input
                    type="text"
                    value={profileData.country}
                    onChange={(e) => setProfileData(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ville</label>
                  <input
                    type="text"
                    value={profileData.city}
                    onChange={(e) => setProfileData(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Adresse complète</label>
                  <textarea
                    value={profileData.address}
                    onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    rows={3}
                    placeholder="Rue, numéro, compléments"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-sm text-gray-500">
                Pour modifier des informations sensibles (email, sécurité), utilisez la page paramètres.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/settings')}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                >
                  Voir plus d’options
                </button>
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors flex items-center gap-2 text-sm disabled:bg-gray-400"
                >
                  {profileSaving && (
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  )}
                  <Save className="w-4 h-4" />
                  <span>{profileSaving ? 'Enregistrement...' : 'Enregistrer'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default TravelerDashboard;

