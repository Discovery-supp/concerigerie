import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { MessageCircle, Send, User, Clock } from 'lucide-react';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  subject: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface MessageBoxProps {
  userId: string;
  userType: string;
}

const MessageBox: React.FC<MessageBoxProps> = ({ userId, userType }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [newMessage, setNewMessage] = useState({
    receiver_id: '',
    subject: '',
    content: ''
  });

  useEffect(() => {
    loadMessages();
  }, [userId]);

  const loadMessages = async () => {
    try {
      // Pour simplifier, on utilise consultation_messages
      // Dans une vraie app, vous auriez une table messages dédiée
      const { data, error } = await supabase
        .from('consultation_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Transformer les données en format Message
      const formattedMessages = (data || []).map(msg => ({
        id: msg.id,
        sender_id: msg.email, // Utiliser email comme identifiant temporaire
        receiver_id: 'admin',
        subject: msg.subject,
        content: msg.message,
        is_read: msg.status !== 'new',
        created_at: msg.created_at,
        sender: {
          first_name: msg.first_name,
          last_name: msg.last_name,
          email: msg.email
        }
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Erreur chargement messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    try {
      // Logique d'envoi de message
      setShowCompose(false);
      setNewMessage({ receiver_id: '', subject: '', content: '' });
      loadMessages();
    } catch (error) {
      console.error('Erreur envoi message:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Chargement des messages...</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-md">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-900">Messagerie</h3>
        <button
          onClick={() => setShowCompose(!showCompose)}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors flex items-center space-x-2"
        >
          <Send className="w-4 h-4" />
          <span>Nouveau message</span>
        </button>
      </div>

      {showCompose && (
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Sujet"
              value={newMessage.subject}
              onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <textarea
              placeholder="Message"
              value={newMessage.content}
              onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <div className="flex space-x-2">
              <button
                onClick={handleSendMessage}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors"
              >
                Envoyer
              </button>
              <button
                onClick={() => setShowCompose(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun message</p>
          </div>
        ) : (
          messages.map(message => (
            <div
              key={message.id}
              onClick={() => setSelectedMessage(message)}
              className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                !message.is_read ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-semibold text-gray-900">
                      {message.sender?.first_name} {message.sender?.last_name}
                    </span>
                    {!message.is_read && (
                      <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-700 mt-1">{message.subject}</p>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-1">{message.content}</p>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(message.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold">{selectedMessage.subject}</h3>
              <button
                onClick={() => setSelectedMessage(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-500">De:</p>
                <p className="font-medium">
                  {selectedMessage.sender?.first_name} {selectedMessage.sender?.last_name}
                </p>
                <p className="text-sm text-gray-500">{selectedMessage.sender?.email}</p>
              </div>
              <div className="mt-4">
                <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.content}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageBox;

