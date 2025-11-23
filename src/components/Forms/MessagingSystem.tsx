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
  userType: 'owner' | 'admin' | 'traveler';
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

  useEffect(() => {
    loadCurrentUser();
    loadConversations();
    loadAvailableUsers();
  }, [userType]); // Recharger quand userType change

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation]);

  // Recharger les utilisateurs quand le modal s'ouvre pour tous les types d'utilisateurs
  useEffect(() => {
    if (showNewMessage) {
      console.log('[MessagingSystem] Modal ouvert, rechargement des utilisateurs pour', userType);
      loadAvailableUsers();
    }
  }, [showNewMessage, userType]);

  // Pré-sélectionner automatiquement l'administrateur pour les voyageurs uniquement
  useEffect(() => {
    if (showNewMessage && userType === 'traveler' && availableUsers.length > 0 && !selectedReceiverId) {
      // Si un seul administrateur, le sélectionner automatiquement
      if (availableUsers.length === 1) {
        const admin = availableUsers[0];
        setSelectedReceiverId(admin.id);
        setSearchQuery(`${admin.first_name} ${admin.last_name}`);
        console.log('[MessagingSystem] Administrateur pré-sélectionné automatiquement:', admin);
      } else if (availableUsers.length > 1) {
        // Si plusieurs administrateurs, sélectionner le premier par défaut
        const firstAdmin = availableUsers[0];
        setSelectedReceiverId(firstAdmin.id);
        setSearchQuery(`${firstAdmin.first_name} ${firstAdmin.last_name}`);
        console.log('[MessagingSystem] Premier administrateur pré-sélectionné:', firstAdmin);
      }
    }
  }, [showNewMessage, userType, availableUsers, selectedReceiverId]);

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
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('[MessagingSystem] Erreur authentification:', authError);
        setAvailableUsers([]);
        return;
      }
      if (!user) {
        console.log('[MessagingSystem] Aucun utilisateur connecté');
        setAvailableUsers([]);
        return;
      }

      console.log('[MessagingSystem] Utilisateur connecté:', user.id);
      console.log('[MessagingSystem] Chargement des utilisateurs disponibles pour userType:', userType);

      // D'abord, vérifier le profil de l'utilisateur actuel
      const { data: currentProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, user_type, first_name, last_name')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('[MessagingSystem] Erreur récupération profil actuel:', profileError);
      } else {
        console.log('[MessagingSystem] Profil actuel:', currentProfile);
      }

      // Test direct: essayer de charger TOUS les utilisateurs sans filtre pour vérifier l'accès RLS
      console.log('[MessagingSystem] Test: Chargement de tous les utilisateurs (sans filtre)...');
      const { data: allUsersTest, error: testError } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name, user_type, email')
        .limit(10);
      
      if (testError) {
        console.error('[MessagingSystem] ERREUR RLS: Impossible de charger les utilisateurs:', testError);
        console.error('[MessagingSystem] Code erreur:', testError.code);
        console.error('[MessagingSystem] Message:', testError.message);
        console.error('[MessagingSystem] Détails:', testError.details);
        console.error('[MessagingSystem] Hint:', testError.hint);
      } else {
        console.log('[MessagingSystem] Test réussi: Nombre d\'utilisateurs trouvés:', allUsersTest?.length || 0);
        if (allUsersTest && allUsersTest.length > 0) {
          console.log('[MessagingSystem] Exemple d\'utilisateurs:', allUsersTest.slice(0, 3));
        }
      }

      let query = supabase
        .from('user_profiles')
        .select('id, first_name, last_name, user_type, email')
        .neq('id', user.id);

      // Logique de communication selon les règles métier
      if (userType === 'owner') {
        // Les hôtes peuvent communiquer avec tout le monde
        // Pas de restriction
        console.log('[MessagingSystem] Pas de restriction pour owner - peut communiquer avec tout le monde');
      } else if (userType === 'traveler') {
        // Les voyageurs ne communiquent qu'avec l'admin
        query = query.in('user_type', ['admin', 'super_admin']);
        console.log('[MessagingSystem] Filtrage pour traveler: admin et super_admin uniquement');
      } else if (userType === 'admin' || userType === 'super_admin') {
        // Les admins peuvent communiquer avec tout le monde
        // Pas de restriction
        console.log('[MessagingSystem] Pas de restriction pour admin/super_admin');
      }

      console.log('[MessagingSystem] Exécution de la requête...');
      
      // Pour les hôtes, forcer le rechargement en ajoutant un petit délai et en vérifiant plusieurs fois
      let users: any[] | null = null;
      let error: any = null;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts && !users && !error) {
        attempts++;
        console.log(`[MessagingSystem] Tentative ${attempts}/${maxAttempts}...`);
        
        const result = await query.order('first_name', { ascending: true });
        users = result.data;
        error = result.error;
        
        if (error) {
          console.error(`[MessagingSystem] Erreur tentative ${attempts}:`, error);
          if (attempts < maxAttempts) {
            // Attendre un peu avant de réessayer
            await new Promise(resolve => setTimeout(resolve, 500));
            // Recréer la requête pour la nouvelle tentative
            query = supabase
              .from('user_profiles')
              .select('id, first_name, last_name, user_type, email')
              .neq('id', user.id);
            if (userType === 'traveler') {
              query = query.in('user_type', ['admin', 'super_admin']);
            }
          }
        } else if (users && users.length > 0) {
          console.log(`[MessagingSystem] Succès à la tentative ${attempts}, ${users.length} utilisateurs chargés`);
          break;
        }
      }

      if (error) {
        console.error('[MessagingSystem] Erreur finale après toutes les tentatives:', error);
        console.error('[MessagingSystem] Code erreur:', error.code);
        console.error('[MessagingSystem] Message erreur:', error.message);
        console.error('[MessagingSystem] Détails de l\'erreur:', JSON.stringify(error, null, 2));
        
        // Si c'est une erreur RLS, essayer une approche alternative
        if (error.code === '42501' || error.message?.includes('permission denied') || error.message?.includes('policy')) {
          console.warn('[MessagingSystem] Erreur RLS détectée, tentative avec une requête plus simple...');
          // Essayer de charger au moins les admins
          const { data: adminUsers, error: adminError } = await supabase
            .from('user_profiles')
            .select('id, first_name, last_name, user_type, email')
            .in('user_type', ['admin', 'super_admin'])
            .neq('id', user.id);
          
          if (!adminError && adminUsers) {
            console.log('[MessagingSystem] Admins chargés en fallback:', adminUsers.length);
            setAvailableUsers(adminUsers);
            return;
          }
        }
        
        setAvailableUsers([]);
        return;
      }

      console.log('[MessagingSystem] Utilisateurs disponibles chargés:', users?.length || 0);
      if (users && users.length > 0) {
        console.log('[MessagingSystem] Liste des utilisateurs:', users);
        setAvailableUsers(users);
      } else {
        console.warn('[MessagingSystem] Aucun utilisateur retourné par la requête');
        console.warn('[MessagingSystem] userType:', userType);
        console.warn('[MessagingSystem] User ID:', user.id);
        
        // Essayer une requête de test simple pour vérifier l'accès
        const { data: testUsers, error: testError } = await supabase
          .from('user_profiles')
          .select('id, first_name, last_name, user_type')
          .limit(5);
        console.log('[MessagingSystem] Test requête simple - erreur:', testError);
        console.log('[MessagingSystem] Test requête simple - résultat:', testUsers);
        
        // Si le test fonctionne mais la requête principale ne fonctionne pas,
        // essayer sans le filtre .neq()
        if (!testError && testUsers && testUsers.length > 0) {
          console.log('[MessagingSystem] La requête de test fonctionne, problème avec le filtre .neq()');
          // Réessayer sans le filtre .neq() et filtrer manuellement
          const { data: allUsers, error: allError } = await supabase
            .from('user_profiles')
            .select('id, first_name, last_name, user_type, email')
            .order('first_name', { ascending: true });
          
          if (!allError && allUsers) {
            // Filtrer manuellement pour exclure l'utilisateur actuel
            const filteredUsers = allUsers.filter(u => u.id !== user.id);
            // Appliquer le filtre selon le type d'utilisateur
            let finalUsers = filteredUsers;
            if (userType === 'traveler') {
              finalUsers = filteredUsers.filter(u => u.user_type === 'admin' || u.user_type === 'super_admin');
            }
            console.log('[MessagingSystem] Utilisateurs filtrés manuellement:', finalUsers.length);
            setAvailableUsers(finalUsers);
            return;
          }
        }
        
        setAvailableUsers([]);
      }
      
      // Si aucun utilisateur trouvé pour les voyageurs, afficher un message
      if (userType === 'traveler' && (!users || users.length === 0)) {
        console.warn('[MessagingSystem] Aucun administrateur trouvé pour le voyageur');
      }
    } catch (error) {
      console.error('[MessagingSystem] Erreur chargement utilisateurs (catch):', error);
      console.error('[MessagingSystem] Stack trace:', (error as Error)?.stack);
      setAvailableUsers([]);
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
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

      // Filtrer selon les règles de communication
      // Les hôtes voient toutes leurs conversations (pas de filtre)
      if (userType === 'traveler') {
        // Les voyageurs ne voient que les conversations avec admin
        // Le filtrage se fera après récupération
      }

      const { data: conversationsData, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur chargement conversations:', error);
        throw error;
      }

      // Récupérer tous les IDs uniques des utilisateurs (senders et receivers)
      const userIds = new Set<string>();
      conversationsData?.forEach((message: any) => {
        if (message.sender_id) userIds.add(message.sender_id);
        if (message.receiver_id) userIds.add(message.receiver_id);
      });

      // Récupérer les profils des utilisateurs
      let userProfilesMap = new Map();
      if (userIds.size > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, first_name, last_name, user_type')
          .in('id', Array.from(userIds));

        profiles?.forEach(profile => {
          userProfilesMap.set(profile.id, profile);
        });
      }

      // Grouper les messages par conversation
      const conversationMap = new Map<string, Conversation>();
      
      conversationsData?.forEach((message: any) => {
        const senderProfile = userProfilesMap.get(message.sender_id);
        const receiverProfile = userProfilesMap.get(message.receiver_id);

        // Vérifier que sender et receiver existent
        if (!senderProfile || !receiverProfile) {
          console.warn('Message avec sender ou receiver manquant:', message);
          return;
        }

        const otherUserId = message.sender_id === user.id ? message.receiver_id : message.sender_id;
        const otherUserProfile = message.sender_id === user.id ? receiverProfile : senderProfile;
        const otherUserName = `${otherUserProfile?.first_name || ''} ${otherUserProfile?.last_name || ''}`.trim() || 'Utilisateur inconnu';
        const otherUserType = otherUserProfile?.user_type;

        // Filtrer selon les règles de communication
        if (userType === 'traveler') {
          // Les voyageurs ne voient que les conversations avec admin
          if (otherUserType !== 'admin' && otherUserType !== 'super_admin') {
            return; // Ignorer cette conversation
          }
        }
        // Les hôtes voient toutes leurs conversations (pas de filtre)

        if (!conversationMap.has(otherUserId)) {
          conversationMap.set(otherUserId, {
            id: otherUserId,
            participants: [user.id, otherUserId],
            last_message: {
              ...message,
              sender: senderProfile,
              receiver: receiverProfile
            },
            unread_count: 0,
            participant_name: otherUserName,
            participant_type: otherUserType
          });
        }

        const conversation = conversationMap.get(otherUserId)!;
        const messageDate = new Date(message.created_at);
        const lastMessageDate = new Date(conversation.last_message.created_at);
        if (messageDate > lastMessageDate) {
          conversation.last_message = {
            ...message,
            sender: senderProfile,
            receiver: receiverProfile
          };
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
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${conversationId}),and(sender_id.eq.${conversationId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erreur chargement messages:', error);
        throw error;
      }

      // Enrichir les messages avec les profils
      if (messagesData && messagesData.length > 0) {
        const userIds = new Set<string>();
        messagesData.forEach(msg => {
          if (msg.sender_id) userIds.add(msg.sender_id);
          if (msg.receiver_id) userIds.add(msg.receiver_id);
        });

        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, first_name, last_name, user_type')
          .in('id', Array.from(userIds));

        const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
        const enrichedMessages = messagesData.map(msg => ({
          ...msg,
          sender: profilesMap.get(msg.sender_id),
          receiver: profilesMap.get(msg.receiver_id)
        }));

        setMessages(enrichedMessages);
      } else {
        setMessages([]);
      }

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

      // Vérifier que le destinataire existe dans user_profiles
      const { data: receiverProfile, error: receiverError } = await supabase
        .from('user_profiles')
        .select('id, user_type')
        .eq('id', selectedConversation)
        .single();

      if (receiverError || !receiverProfile) {
        console.error('Erreur récupération destinataire:', receiverError);
        alert('Destinataire introuvable. Veuillez réessayer.');
        setSending(false);
        return;
      }

      // Vérifier les règles de communication avant d'envoyer
      if (userType === 'traveler') {
        // Les voyageurs ne peuvent envoyer qu'à l'admin
        if (receiverProfile?.user_type !== 'admin' && receiverProfile?.user_type !== 'super_admin') {
          alert('En tant que voyageur, vous ne pouvez communiquer qu\'avec l\'administration.');
          setSending(false);
          return;
        }
      }
      // Les hôtes peuvent communiquer avec tout le monde (pas de restriction)

      console.log('Envoi message de', user.id, 'vers', selectedConversation);

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
        .select('*')
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

      // Vérifier que le destinataire existe dans user_profiles
      const { data: receiverProfile, error: receiverError } = await supabase
        .from('user_profiles')
        .select('id, user_type')
        .eq('id', selectedReceiverId)
        .single();

      if (receiverError || !receiverProfile) {
        console.error('Erreur récupération destinataire:', receiverError);
        alert('Destinataire introuvable. Veuillez réessayer.');
        setSending(false);
        return;
      }

      // Vérifier les règles de communication avant d'envoyer
      if (userType === 'owner' || userType === 'traveler') {
        // Les hôtes et voyageurs ne peuvent envoyer qu'à l'admin
        if (receiverProfile?.user_type !== 'admin' && receiverProfile?.user_type !== 'super_admin') {
          alert('Vous ne pouvez communiquer qu\'avec l\'administration.');
          setSending(false);
          return;
        }
      }

      console.log('Nouveau message de', user.id, 'vers', selectedReceiverId);

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

  const filteredUsers = availableUsers.filter(user => {
    if (!searchQuery.trim()) {
      // Si pas de recherche, afficher tous les utilisateurs disponibles
      return true;
    }
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
            onClick={async () => {
              console.log('[MessagingSystem] Ouverture du modal, userType:', userType);
              // Recharger les utilisateurs disponibles quand on ouvre le modal
              console.log('[MessagingSystem] Rechargement des utilisateurs pour', userType);
              await loadAvailableUsers();
              setShowNewMessage(true);
            }}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Destinataire *
                  </label>
                  {userType === 'traveler' && (
                    <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-900">
                        <strong>Note :</strong> En tant que voyageur, vous pouvez uniquement contacter l'administration.
                      </p>
                    </div>
                  )}
                  
                  {/* Pour les voyageurs uniquement, afficher directement les administrateurs sous forme de cartes */}
                  {userType === 'traveler' ? (
                    <>
                      {loadingUsers ? (
                        <div className="p-6 text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                          <p className="text-sm text-gray-600">Chargement des administrateurs...</p>
                        </div>
                      ) : availableUsers.length > 0 ? (
                        <div className="space-y-2">
                          {availableUsers.map((user) => (
                            <button
                              key={user.id}
                              type="button"
                              onClick={() => {
                                setSelectedReceiverId(user.id);
                                setSearchQuery(`${user.first_name} ${user.last_name}`);
                              }}
                              className={`w-full p-4 text-left border-2 rounded-lg transition-all ${
                                selectedReceiverId === user.id 
                                  ? 'border-blue-600 bg-blue-50 shadow-md' 
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0">
                                  {getConversationIcon(user.user_type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-gray-900">
                                    {user.first_name} {user.last_name}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {getUserTypeLabel(user.user_type)}
                                    {user.email && (
                                      <span className="ml-1">• {user.email}</span>
                                    )}
                                  </p>
                                </div>
                                {selectedReceiverId === user.id && (
                                  <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0" />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 text-center border-2 border-dashed border-gray-300 rounded-lg">
                          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            Aucun administrateur disponible
                          </p>
                          <p className="text-xs text-gray-500">
                            Veuillez contacter le support si vous avez besoin d'aide.
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={userType === 'traveler' ? "Rechercher un administrateur..." : "Rechercher un utilisateur..."}
                        />
                      </div>
                      
                      {/* Liste des utilisateurs */}
                      <div className="mt-2 max-h-64 overflow-y-auto border border-gray-200 rounded-md">
                        {loadingUsers ? (
                          <div className="p-4 text-center text-sm text-gray-500">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mx-auto mb-2"></div>
                            Chargement des utilisateurs...
                          </div>
                        ) : availableUsers.length === 0 ? (
                          <div className="p-4 text-center text-sm text-gray-500">
                            <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="font-medium">Aucun utilisateur disponible</p>
                            <p className="text-xs mt-1">
                              {userType === 'traveler' 
                                ? 'Aucun administrateur trouvé. Veuillez contacter le support si vous avez besoin d\'aide.'
                                : 'Aucun utilisateur trouvé dans le système.'}
                            </p>
                          </div>
                        ) : filteredUsers.length === 0 ? (
                          <div className="p-4 text-center text-sm text-gray-500">
                            <p>Aucun utilisateur ne correspond à votre recherche</p>
                            <p className="text-xs mt-1">Essayez avec d'autres mots-clés</p>
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
                                  <div className="flex-shrink-0">
                                    {getConversationIcon(user.user_type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {user.first_name} {user.last_name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {getUserTypeLabel(user.user_type)}
                                      {user.email && (
                                        <span className="ml-1">• {user.email}</span>
                                      )}
                                    </p>
                                  </div>
                                  {selectedReceiverId === user.id && (
                                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  
                  {selectedReceiverId && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-green-900">
                            Destinataire sélectionné
                          </p>
                          <p className="text-xs text-green-700">
                            {availableUsers.find(u => u.id === selectedReceiverId)?.first_name} {availableUsers.find(u => u.id === selectedReceiverId)?.last_name} 
                            {' '}({getUserTypeLabel(availableUsers.find(u => u.id === selectedReceiverId)?.user_type || '')})
                          </p>
                        </div>
                      </div>
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
