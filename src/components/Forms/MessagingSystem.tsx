import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { MessageCircle, Send, User, Clock, CheckCircle, AlertCircle, Phone, Mail, Home, Calendar, Search, X } from 'lucide-react';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  subject: string;
  content: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  sender_name?: string;
  receiver_name?: string;
  sender_type?: string;
  receiver_type?: string;
}

interface Conversation {
  id: string;
  participants: string[];
  last_message: Message;
  unread_count: number;
  participant_name: string;
  participant_type: string;
}

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  user_type: string;
  email?: string;
}

interface MessagingSystemProps {
  userType: 'owner' | 'admin' | 'traveler' | 'provider' | 'super_admin';
  onSuccess?: () => void;
}

const MessagingSystem: React.FC<MessagingSystemProps> = ({
  userType,
  onSuccess
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [selectedReceiverId, setSelectedReceiverId] = useState<string | null>(null);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Définir, selon le rôle connecté, avec qui il peut échanger
  const getAllowedReceiverTypes = (type: string): string[] => {
    switch (type) {
      case 'owner':
        // Un hôte échange avec ses clients (voyageurs) et l'administration
        return ['traveler', 'admin', 'super_admin'];
      case 'traveler':
        // Un voyageur échange avec les hôtes et l'administration
        return ['owner', 'admin', 'super_admin'];
      case 'provider':
        // Prestataire → admin + propriétaires
        return ['admin', 'super_admin', 'owner'];
      case 'admin':
      case 'super_admin':
        // Admin → tout le monde
        return ['owner', 'traveler', 'provider', 'partner', 'admin', 'super_admin'];
      default:
        return ['admin', 'super_admin'];
    }
  };

  useEffect(() => {
    loadCurrentUser();
    loadConversations();
    loadAvailableUsers();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation]);

  const loadCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setCurrentUser(profile);
      }
    } catch (error) {
      console.error('Erreur chargement utilisateur:', error);
    }
  };

  const loadAvailableUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Récupérer le type d'utilisateur actuel
      const { data: currentProfile } = await supabase
        .from('user_profiles')
        .select('user_type')
        .eq('id', user.id)
        .single();

      let query = supabase
        .from('user_profiles')
        .select('id, first_name, last_name, user_type, email')
        .neq('id', user.id);

      // Logique de communication selon les règles métier
      const allowedTypes = getAllowedReceiverTypes(userType || currentProfile?.user_type);

      // Pour les rôles non-admin, filtrer explicitement les types autorisés
      if (userType !== 'admin' && userType !== 'super_admin') {
        query = query.in('user_type', allowedTypes);
      }

      const { data: users, error } = await query.order('first_name', { ascending: true });

      if (error) throw error;

      let finalUsers = users || [];

      // Sécuriser : s'il n'y a aucun admin dans la liste (cas voyageur/proprio),
      // on force l’ajout d’au moins un compte admin/super_admin
      if ((userType === 'traveler' || userType === 'owner') &&
          !finalUsers.some(u => u.user_type === 'admin' || u.user_type === 'super_admin')) {
        const { data: fallbackAdmins, error: fallbackError } = await supabase
          .from('user_profiles')
          .select('id, first_name, last_name, user_type, email')
          .in('user_type', ['admin', 'super_admin'])
          .order('first_name', { ascending: true })
          .limit(3);

        if (!fallbackError && fallbackAdmins && fallbackAdmins.length > 0) {
          // Fusionner sans doublons
          const existingIds = new Set(finalUsers.map(u => u.id));
          const merged = [
            ...fallbackAdmins.filter(a => !existingIds.has(a.id)),
            ...finalUsers,
          ];
          finalUsers = merged;
        }
      }

      setAvailableUsers(finalUsers);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadConversations = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Récupérer le type d'utilisateur actuel
      const { data: currentProfile } = await supabase
        .from('user_profiles')
        .select('user_type')
        .eq('id', user.id)
        .single();

      let query = supabase
        .from('messages')
        .select(`
          *,
          sender:user_profiles!sender_id(first_name, last_name, user_type),
          receiver:user_profiles!receiver_id(first_name, last_name, user_type)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

      // Filtrer selon les règles de communication
      if (userType === 'owner') {
        // Les hôtes ne voient que les conversations avec admin
        // Le filtrage se fera après récupération
      } else if (userType === 'traveler') {
        // Les voyageurs ne voient que les conversations avec admin
        // Le filtrage se fera après récupération
      }

      const { data: conversationsData, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Grouper les messages par conversation
      const conversationMap = new Map<string, Conversation>();
      
      conversationsData?.forEach((message: any) => {
        // Vérifier que sender et receiver existent
        if (!message.sender || !message.receiver) {
          console.warn('Message avec sender ou receiver manquant:', message);
          return;
        }

        const otherUserId = message.sender_id === user.id ? message.receiver_id : message.sender_id;
        const otherUserName = message.sender_id === user.id 
          ? `${message.receiver?.first_name || ''} ${message.receiver?.last_name || ''}`.trim() || 'Utilisateur inconnu'
          : `${message.sender?.first_name || ''} ${message.sender?.last_name || ''}`.trim() || 'Utilisateur inconnu';
        const otherUserType = message.sender_id === user.id 
          ? message.receiver?.user_type
          : message.sender?.user_type;

        // Filtrer selon les règles de communication
        if (userType === 'owner' || userType === 'traveler') {
          // Les hôtes et voyageurs ne voient que les conversations avec admin
          if (otherUserType !== 'admin' && otherUserType !== 'super_admin') {
            return; // Ignorer cette conversation
          }
        }

        if (!conversationMap.has(otherUserId)) {
          conversationMap.set(otherUserId, {
            id: otherUserId,
            participants: [user.id, otherUserId],
            last_message: message,
            unread_count: 0,
            participant_name: otherUserName,
            participant_type: otherUserType
          });
        }

        const conversation = conversationMap.get(otherUserId)!;
        if (new Date(message.created_at) > new Date(conversation.last_message.created_at)) {
          conversation.last_message = message;
        }
        if (!message.is_read && message.receiver_id === user.id) {
          conversation.unread_count++;
        }
      });

      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      console.error('Erreur chargement conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: messagesData, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:user_profiles!sender_id(first_name, last_name, user_type),
          receiver:user_profiles!receiver_id(first_name, last_name, user_type)
        `)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${conversationId}),and(sender_id.eq.${conversationId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(messagesData || []);

      // Marquer les messages comme lus
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('receiver_id', user.id)
        .eq('sender_id', conversationId);

    } catch (error) {
      console.error('Erreur chargement messages:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) {
      alert('Veuillez saisir un message');
      return;
    }

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Vous devez être connecté pour envoyer un message');
        setSending(false);
        return;
      }

      // Vérifier les règles de communication avant d'envoyer
      const { data: receiverProfile } = await supabase
        .from('user_profiles')
        .select('user_type')
        .eq('id', selectedConversation)
        .single();

      const allowedTypes = getAllowedReceiverTypes(userType || receiverProfile?.user_type);
      if (!receiverProfile || !allowedTypes.includes(receiverProfile.user_type)) {
        alert('Vous ne pouvez pas communiquer avec ce type de compte.');
        setSending(false);
        return;
      }

      // Vérifier que le destinataire existe dans user_profiles
      const { data: receiverCheck } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', selectedConversation)
        .single();

      if (!receiverCheck) {
        alert('Destinataire introuvable. Veuillez réessayer.');
        setSending(false);
        return;
      }

      // Insérer le message dans la base de données
      const { data: insertedMessage, error } = await supabase
        .from('messages')
        .insert([{
          sender_id: user.id,
          receiver_id: selectedConversation,
          subject: 'Message',
          content: newMessage.trim(),
          is_read: false
        }])
        .select(`
          *,
          sender:user_profiles!sender_id(first_name, last_name, user_type),
          receiver:user_profiles!receiver_id(first_name, last_name, user_type)
        `)
        .single();

      if (error) {
        console.error('Erreur détaillée insertion message:', error);
        alert(`Erreur lors de l'envoi: ${error.message}`);
        setSending(false);
        return;
      }

      if (!insertedMessage) {
        console.error('Message non inséré');
        alert('Le message n\'a pas été enregistré. Veuillez réessayer.');
        setSending(false);
        return;
      }

      console.log('Message inséré avec succès:', insertedMessage);

      // Réinitialiser le formulaire
      setNewMessage('');
      
      // Recharger les messages pour afficher le nouveau message
      await loadMessages(selectedConversation);
      
      // Recharger les conversations pour mettre à jour la dernière conversation
      await loadConversations();
      
      // Notification de succès
      console.log('Message envoyé avec succès:', insertedMessage);
      
      onSuccess?.();
    } catch (error: any) {
      console.error('Erreur envoi message:', error);
      alert(`Erreur lors de l'envoi du message: ${error.message || 'Une erreur est survenue'}`);
    } finally {
      setSending(false);
    }
  };

  const startNewConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedReceiverId) {
      alert('Veuillez sélectionner un destinataire et saisir un message');
      return;
    }

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Vous devez être connecté pour envoyer un message');
        setSending(false);
        return;
      }

      // Vérifier les règles de communication avant d'envoyer
      const { data: receiverProfile } = await supabase
        .from('user_profiles')
        .select('user_type')
        .eq('id', selectedReceiverId)
        .single();

      const allowedTypes = getAllowedReceiverTypes(userType || receiverProfile?.user_type);
      if (!receiverProfile || !allowedTypes.includes(receiverProfile.user_type)) {
        alert('Vous ne pouvez pas communiquer avec ce type de compte.');
        setSending(false);
        return;
      }

      // Insérer le message dans la base de données
      const { data: insertedMessage, error } = await supabase
        .from('messages')
        .insert([{
          sender_id: user.id,
          receiver_id: selectedReceiverId,
          subject: newSubject.trim() || 'Nouveau message',
          content: newMessage.trim(),
          is_read: false
        }])
        .select()
        .single();

      if (error) {
        console.error('Erreur détaillée:', error);
        throw error;
      }

      if (!insertedMessage) {
        throw new Error('Le message n\'a pas été enregistré');
      }

      console.log('Message envoyé avec succès:', insertedMessage);

      // Réinitialiser le formulaire
      setNewMessage('');
      setNewSubject('');
      setSelectedReceiverId(null);
      setSearchQuery('');
      setShowNewMessage(false);
      
      // Recharger les conversations
      await loadConversations();
      
      // Sélectionner automatiquement la nouvelle conversation
      setSelectedConversation(selectedReceiverId);
      
      // Charger les messages de la nouvelle conversation
      await loadMessages(selectedReceiverId);
      
      onSuccess?.();
    } catch (error: any) {
      console.error('Erreur nouveau message:', error);
      alert(`Erreur lors de l'envoi du message: ${error.message || 'Une erreur est survenue'}`);
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 jours
      return date.toLocaleDateString('fr-FR', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  };

  const getConversationIcon = (userType: string) => {
    switch (userType) {
      case 'admin':
      case 'super_admin': 
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'owner': 
        return <Home className="w-5 h-5 text-blue-600" />;
      case 'traveler': 
        return <User className="w-5 h-5 text-green-600" />;
      case 'provider': 
        return <Phone className="w-5 h-5 text-purple-600" />;
      case 'partner': 
        return <Mail className="w-5 h-5 text-orange-600" />;
      default: 
        return <User className="w-5 h-5 text-gray-600" />;
    }
  };

  const getUserTypeLabel = (userType: string) => {
    const labels: { [key: string]: string } = {
      'admin': 'Administrateur',
      'super_admin': 'Super Admin',
      'owner': 'Propriétaire',
      'traveler': 'Voyageur',
      'provider': 'Prestataire',
      'partner': 'Partenaire'
    };
    return labels[userType] || userType;
  };

  // Permet au voyageur de sélectionner rapidement l'administration comme contact
  const handleSelectAdminContact = async () => {
    try {
      setLoadingUsers(true);

      const { data: admins, error } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name, user_type, email')
        .in('user_type', ['admin', 'super_admin'])
        .order('first_name', { ascending: true })
        .limit(1);

      if (error) {
        console.error('Erreur chargement contact admin:', error);
        alert('Impossible de récupérer le contact de l’administration pour le moment.');
        return;
      }

      if (!admins || admins.length === 0) {
        alert('Aucun compte administrateur n’est configuré pour le moment.');
        return;
      }

      const admin = admins[0];

      // Sélectionner automatiquement l’admin comme destinataire
      setSelectedReceiverId(admin.id);
      setSearchQuery(`${admin.first_name} ${admin.last_name}`);

      // S’assurer que l’admin apparaît aussi dans la liste des utilisateurs
      setAvailableUsers((prev) => {
        const exists = prev.some((u) => u.id === admin.id);
        return exists ? prev : [admin, ...prev];
      });
    } catch (error) {
      console.error('Erreur sélection contact admin:', error);
      alert('Une erreur est survenue lors de la sélection de l’administration.');
    } finally {
      setLoadingUsers(false);
    }
  };

  const filteredUsers = availableUsers.filter(user => {
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
    const searchLower = searchQuery.toLowerCase();
    return fullName.includes(searchLower) || 
           user.user_type.toLowerCase().includes(searchLower) ||
           (user.email && user.email.toLowerCase().includes(searchLower));
  });

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Messagerie
            </h2>
            <p className="text-gray-600">
              Communiquez avec les autres utilisateurs
            </p>
          </div>
          <button
            onClick={() => setShowNewMessage(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Nouveau message</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des conversations */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Conversations</h3>
            </div>
            
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Chargement...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Aucune conversation</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation.id)}
                    className={`w-full p-4 text-left hover:bg-gray-50 ${
                      selectedConversation === conversation.id ? 'bg-blue-50 border-r-2 border-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {getConversationIcon(conversation.participant_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {conversation.participant_name}
                          </p>
                          {conversation.unread_count > 0 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              {conversation.unread_count}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {getUserTypeLabel(conversation.participant_type)}
                        </p>
                        <p className="text-sm text-gray-500 truncate mt-1">
                          {conversation.last_message.content}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDate(conversation.last_message.created_at)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Zone de messages */}
        <div className="lg:col-span-2">
          {selectedConversation ? (
            <div className="bg-white rounded-lg shadow-sm border h-[600px] flex flex-col">
              {/* En-tête de la conversation */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  {getConversationIcon(
                    conversations.find(c => c.id === selectedConversation)?.participant_type || 'user'
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {conversations.find(c => c.id === selectedConversation)?.participant_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {getUserTypeLabel(conversations.find(c => c.id === selectedConversation)?.participant_type || '')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: '500px', scrollbarWidth: 'thin' }}>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender_id === currentUser?.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender_id === currentUser?.id ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {formatDate(message.created_at)}
                        {message.sender_id === currentUser?.id && (
                          <span className="ml-1">
                            {message.is_read ? <CheckCircle className="w-3 h-3 inline" /> : <Clock className="w-3 h-3 inline" />}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Formulaire d'envoi */}
              <div className="p-4 border-t border-gray-200">
                <form onSubmit={sendMessage} className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Tapez votre message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center min-w-[80px]"
                  >
                    {sending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border h-[600px] flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Sélectionnez une conversation
                </h3>
                <p className="text-gray-600">
                  Choisissez une conversation pour commencer à échanger
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal nouveau message */}
      {showNewMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] flex flex-col">
            <div className="p-6 flex-shrink-0">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Nouveau message
                </h3>
                <button
                  onClick={() => {
                    setShowNewMessage(false);
                    setSelectedReceiverId(null);
                    setSearchQuery('');
                    setNewMessage('');
                    setNewSubject('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={startNewConversation} className="space-y-4">
                {/* Sélection du destinataire */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Destinataire *
                    </label>
                    {(userType === 'traveler' || userType === 'owner') && (
                      <button
                        type="button"
                        onClick={handleSelectAdminContact}
                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        Contacter l’administration
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setSearchQuery('')}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Rechercher un utilisateur..."
                    />
                  </div>
                  
                  {/* Liste des utilisateurs */}
                  <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md">
                    {loadingUsers ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        Chargement...
                      </div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500 space-y-2">
                        <p>Aucun utilisateur trouvé</p>
                        {(userType === 'traveler' || userType === 'owner') && (
                          <button
                            type="button"
                            onClick={handleSelectAdminContact}
                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                          >
                            Contacter l’administration
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {filteredUsers.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => {
                              setSelectedReceiverId(user.id);
                              setSearchQuery(`${user.first_name} ${user.last_name}`);
                            }}
                            className={`w-full p-3 text-left hover:bg-gray-50 transition-colors ${
                              selectedReceiverId === user.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              {getConversationIcon(user.user_type)}
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {user.first_name} {user.last_name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {getUserTypeLabel(user.user_type)}
                                </p>
                              </div>
                              {selectedReceiverId === user.id && (
                                <CheckCircle className="w-5 h-5 text-blue-600" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {selectedReceiverId && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-md text-sm text-blue-900">
                      Destinataire sélectionné: {filteredUsers.find(u => u.id === selectedReceiverId)?.first_name} {filteredUsers.find(u => u.id === selectedReceiverId)?.last_name}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sujet
                  </label>
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Sujet du message (optionnel)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Votre message..."
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewMessage(false);
                      setSelectedReceiverId(null);
                      setSearchQuery('');
                      setNewMessage('');
                      setNewSubject('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedReceiverId || !newMessage.trim() || sending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2 min-w-[100px] justify-center"
                  >
                    {sending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Envoi...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Envoyer</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagingSystem;
