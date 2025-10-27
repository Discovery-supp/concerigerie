import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { MessageCircle, Send, User, Clock, CheckCircle, AlertCircle, Phone, Mail, Home, Calendar } from 'lucide-react';

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
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    loadCurrentUser();
    loadConversations();
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

  const loadConversations = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Charger les conversations où l'utilisateur est soit sender soit receiver
      const { data: conversationsData, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:user_profiles!messages_sender_id_fkey(first_name, last_name, user_type),
          receiver:user_profiles!messages_receiver_id_fkey(first_name, last_name, user_type)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Grouper les messages par conversation
      const conversationMap = new Map<string, Conversation>();
      
      conversationsData?.forEach((message: any) => {
        const otherUserId = message.sender_id === user.id ? message.receiver_id : message.sender_id;
        const otherUserName = message.sender_id === user.id 
          ? `${message.receiver.first_name} ${message.receiver.last_name}`
          : `${message.sender.first_name} ${message.sender.last_name}`;
        const otherUserType = message.sender_id === user.id 
          ? message.receiver.user_type
          : message.sender.user_type;

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
        if (message.created_at > conversation.last_message.created_at) {
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
          sender:user_profiles!messages_sender_id_fkey(first_name, last_name, user_type),
          receiver:user_profiles!messages_receiver_id_fkey(first_name, last_name, user_type)
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
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('messages')
        .insert([{
          sender_id: user.id,
          receiver_id: selectedConversation,
          subject: newSubject || 'Message',
          content: newMessage,
          is_read: false
        }]);

      if (error) throw error;

      setNewMessage('');
      setNewSubject('');
      loadMessages(selectedConversation);
      loadConversations();
      onSuccess?.();
    } catch (error) {
      console.error('Erreur envoi message:', error);
      alert('Erreur lors de l\'envoi du message');
    }
  };

  const startNewConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Pour l'instant, on envoie à l'administration
      // Dans une vraie application, on aurait une liste d'utilisateurs
      const { data: adminUsers } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_type', 'admin')
        .limit(1);

      if (adminUsers && adminUsers.length > 0) {
        const { error } = await supabase
          .from('messages')
          .insert([{
            sender_id: user.id,
            receiver_id: adminUsers[0].id,
            subject: newSubject || 'Nouveau message',
            content: newMessage,
            is_read: false
          }]);

        if (error) throw error;

        setNewMessage('');
        setNewSubject('');
        setShowNewMessage(false);
        loadConversations();
        onSuccess?.();
      }
    } catch (error) {
      console.error('Erreur nouveau message:', error);
      alert('Erreur lors de l\'envoi du message');
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
      case 'admin': return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'owner': return <Home className="w-5 h-5 text-blue-600" />;
      case 'traveler': return <User className="w-5 h-5 text-green-600" />;
      default: return <User className="w-5 h-5 text-gray-600" />;
    }
  };

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
                        <p className="text-sm text-gray-500 truncate">
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
                      {conversations.find(c => c.id === selectedConversation)?.participant_type}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Send className="w-4 h-4" />
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
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Nouveau message
                </h3>
                <button
                  onClick={() => setShowNewMessage(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <AlertCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={startNewConversation} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sujet
                  </label>
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Sujet du message"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
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
                    onClick={() => setShowNewMessage(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Envoyer
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
