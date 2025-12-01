import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Calendar, 
  DollarSign, 
  MessageCircle, 
  Star,
  X,
  Settings,
  Filter
} from 'lucide-react';

interface Notification {
  id: string;
  user_id: string;
  type: 'reservation' | 'payment' | 'review' | 'message' | 'reminder' | 'system';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  data?: any;
  priority: 'low' | 'medium' | 'high';
}

interface NotificationSystemProps {
  userType: 'owner' | 'admin' | 'traveler' | 'provider';
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({ userType }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Charger les notifications depuis la base de données
      const { data: notificationsData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      setNotifications(notificationsData || []);

      // Simuler des notifications pour la démo
      const demoNotifications: Notification[] = [
        {
          id: '1',
          user_id: user.id,
          type: 'reservation',
          title: 'Nouvelle réservation',
          message: 'Vous avez reçu une nouvelle réservation pour votre propriété "Villa Paradis"',
          is_read: false,
          created_at: new Date().toISOString(),
          priority: 'high'
        },
        {
          id: '2',
          user_id: user.id,
          type: 'payment',
          title: 'Paiement reçu',
          message: 'Paiement de €450 reçu pour la réservation #12345',
          is_read: false,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          priority: 'medium'
        },
        {
          id: '3',
          user_id: user.id,
          type: 'review',
          title: 'Nouvel avis',
          message: 'Marie D. a laissé un avis 5 étoiles pour votre propriété',
          is_read: true,
          created_at: new Date(Date.now() - 7200000).toISOString(),
          priority: 'low'
        },
        {
          id: '4',
          user_id: user.id,
          type: 'reminder',
          title: 'Check-in dans 2 heures',
          message: 'Les invités de la Villa Paradis arrivent dans 2 heures',
          is_read: false,
          created_at: new Date(Date.now() - 1800000).toISOString(),
          priority: 'high'
        },
        {
          id: '5',
          user_id: user.id,
          type: 'message',
          title: 'Nouveau message',
          message: 'Vous avez reçu un message de l\'administration',
          is_read: false,
          created_at: new Date(Date.now() - 900000).toISOString(),
          priority: 'medium'
        }
      ];

      setNotifications(demoNotifications);

    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Erreur marquer comme lu:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', unreadIds);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
    } catch (error) {
      console.error('Erreur marquer tout comme lu:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Erreur suppression notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'reservation': return <Calendar className="w-5 h-5 text-blue-600" />;
      case 'payment': return <DollarSign className="w-5 h-5 text-green-600" />;
      case 'review': return <Star className="w-5 h-5 text-yellow-600" />;
      case 'message': return <MessageCircle className="w-5 h-5 text-purple-600" />;
      case 'reminder': return <Clock className="w-5 h-5 text-orange-600" />;
      case 'system': return <AlertCircle className="w-5 h-5 text-gray-600" />;
      default: return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-gray-500';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.is_read;
    return notification.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="relative">
      {/* Bouton de notification */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Panneau de notifications */}
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <div className="flex items-center space-x-2">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="text-sm border border-gray-300 rounded-md px-2 py-1"
                >
                  <option value="all">Toutes</option>
                  <option value="unread">Non lues</option>
                  <option value="reservation">Réservations</option>
                  <option value="payment">Paiements</option>
                  <option value="review">Avis</option>
                  <option value="message">Messages</option>
                  <option value="reminder">Rappels</option>
                </select>
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Tout marquer comme lu
                </button>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Chargement...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Aucune notification</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer border-l-4 ${getPriorityColor(notification.priority)} ${
                      !notification.is_read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </h4>
                          <div className="flex items-center space-x-2">
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className="text-gray-400 hover:text-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(notification.created_at).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {filteredNotifications.length > 0 && (
            <div className="p-4 border-t border-gray-200">
              <button className="w-full text-sm text-blue-600 hover:text-blue-700">
                Voir toutes les notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationSystem;


