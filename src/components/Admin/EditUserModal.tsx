import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { supabaseAdmin, isServiceRoleAvailable } from '../../lib/supabase-admin';
import { X, User, Mail, Phone, Lock, Eye, EyeOff, RefreshCw } from 'lucide-react';

interface User {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  user_type: string;
}

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
  user: User | null;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, onUserUpdated, user }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    userType: 'traveler'
  });
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const userTypes = [
    { value: 'traveler', label: 'Voyageur' },
    { value: 'owner', label: 'Propriétaire' },
    { value: 'partner', label: 'Partenaire' },
    { value: 'provider', label: 'Prestataire' },
    { value: 'admin', label: 'Administrateur' },
    { value: 'super_admin', label: 'Super Administrateur' }
  ];

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        userType: user.user_type || 'traveler'
      });
      setNewPassword('');
      setError('');
      setSuccess('');
    }
  }, [user, isOpen]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // Mettre à jour le profil utilisateur
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone || null,
          user_type: formData.userType,
          email: formData.email
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Mettre à jour l'email dans auth.users si changé (nécessite client admin)
      if (isServiceRoleAvailable && supabaseAdmin) {
        if (formData.email !== user.email) {
          const { error: emailError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
            email: formData.email,
            user_metadata: {
              firstName: formData.firstName,
              lastName: formData.lastName,
              phone: formData.phone,
              userType: formData.userType
            }
          });

          if (emailError) {
            console.warn('Erreur mise à jour email:', emailError);
            // Ne pas bloquer si l'email ne peut pas être mis à jour
          }
        } else {
          // Mettre à jour seulement les métadonnées si l'email n'a pas changé
          const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
            user_metadata: {
              firstName: formData.firstName,
              lastName: formData.lastName,
              phone: formData.phone,
              userType: formData.userType
            }
          });

          if (metadataError) {
            console.warn('Erreur mise à jour métadonnées:', metadataError);
          }
        }
      } else {
        console.warn('Client admin non disponible. Les métadonnées auth ne seront pas mises à jour.');
      }

      setSuccess('Profil utilisateur mis à jour avec succès !');
      setTimeout(() => {
        onUserUpdated();
        onClose();
      }, 1500);
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la mise à jour du profil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user) return;
    if (!newPassword || newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // Vérifier que le client admin est disponible
      if (!isServiceRoleAvailable || !supabaseAdmin) {
        throw new Error('La réinitialisation de mot de passe nécessite la configuration de la clé service_role. Veuillez configurer VITE_SUPABASE_SERVICE_ROLE_KEY dans votre fichier .env (développement uniquement) ou utiliser une Edge Function en production.');
      }

      // Réinitialiser le mot de passe via l'API admin
      const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password: newPassword
      });

      if (passwordError) throw passwordError;

      setSuccess('Mot de passe réinitialisé avec succès !');
      setNewPassword('');
      setTimeout(() => {
        onUserUpdated();
      }, 1500);
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la réinitialisation du mot de passe');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Modifier le profil utilisateur</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}

          {!isServiceRoleAvailable && (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
              <p className="text-sm font-medium mb-1">⚠️ Fonctionnalités limitées</p>
              <p className="text-xs">
                La réinitialisation de mot de passe nécessite la configuration de la clé service_role. 
                Configurez VITE_SUPABASE_SERVICE_ROLE_KEY dans votre fichier .env (développement uniquement) 
                ou utilisez une Edge Function en production.
              </p>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            {/* Informations du profil */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations du profil</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      id="firstName"
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Prénom"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Nom *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      id="lastName"
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nom"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+243 XXX XXX XXX"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="userType" className="block text-sm font-medium text-gray-700 mb-1">
                  Type d'utilisateur *
                </label>
                <select
                  id="userType"
                  value={formData.userType}
                  onChange={(e) => handleInputChange('userType', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {userTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Réinitialisation du mot de passe */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <RefreshCw className="w-5 h-5 mr-2" />
                Réinitialiser le mot de passe
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Laissez vide si vous ne souhaitez pas modifier le mot de passe. Le nouveau mot de passe sera envoyé à l'utilisateur.
              </p>
              
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nouveau mot de passe (min. 8 caractères)"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              
              {newPassword && (
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={isLoading || newPassword.length < 8}
                  className={`mt-3 px-4 py-2 rounded-lg text-white transition-colors ${
                    isLoading || newPassword.length < 8
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                >
                  {isLoading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
                </button>
              )}
            </div>

            <div className="flex space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isLoading ? 'Mise à jour...' : 'Enregistrer les modifications'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal;

