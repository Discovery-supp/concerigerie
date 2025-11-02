import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import MessagingSystem from '../components/Forms/MessagingSystem';
import { ArrowLeft } from 'lucide-react';

const MessagingPage: React.FC = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = React.useState<'owner' | 'admin' | 'traveler' | 'provider' | 'partner' | 'super_admin'>('owner');

  React.useEffect(() => {
    checkUserType();
  }, []);

  const checkUserType = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('user_type')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserType(profile.user_type as 'owner' | 'admin' | 'traveler' | 'provider' | 'partner' | 'super_admin');
      }
    } catch (error) {
      console.error('Erreur vérification type utilisateur:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour au tableau de bord</span>
          </button>
        </div>

        <MessagingSystem
          userType={userType}
          onSuccess={() => {
            // Optionnel: recharger les données
          }}
        />
      </div>
    </div>
  );
};

export default MessagingPage;
