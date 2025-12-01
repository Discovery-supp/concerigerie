import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, Phone, MapPin, Calendar, Upload, CheckCircle } from 'lucide-react';
import authService from '../services/auth';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';

const TravelerRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    // Informations personnelles
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    // Informations de contact
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    // Adresse
    country: '',
    city: '',
    address: '',
    postalCode: '',
    // Vérification
    profilePhoto: null as File | null,
    captcha: '',
    acceptTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [captchaValue, setCaptchaValue] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState(0);

  // Générer un captcha simple
  React.useEffect(() => {
    const generateCaptcha = () => {
      const num1 = Math.floor(Math.random() * 10) + 1;
      const num2 = Math.floor(Math.random() * 10) + 1;
      setCaptchaValue(`${num1} + ${num2}`);
      setCaptchaAnswer(num1 + num2);
    };
    generateCaptcha();
  }, []);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleInputChange('profilePhoto', e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validations
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    // Vérifier le captcha
    if (parseInt(captchaInput) !== captchaAnswer) {
      setError('La réponse au captcha est incorrecte');
      return;
    }

    if (!formData.acceptTerms) {
      setError('Vous devez accepter les conditions générales');
      return;
    }

    setIsLoading(true);

    try {
      // Créer le compte utilisateur
      const result = await authService.signUp(formData.email, formData.password, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        userType: 'traveler',
        dateOfBirth: formData.dateOfBirth,
        country: formData.country,
        city: formData.city,
        address: formData.address,
        postalCode: formData.postalCode
      });

      if (result && result.user) {
        // Upload de la photo de profil si fournie
        if (formData.profilePhoto) {
          try {
            const fileExt = formData.profilePhoto.name.split('.').pop();
            const fileName = `${result.user.id}-${Math.random()}.${fileExt}`;
            const filePath = `profiles/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from('avatars')
              .upload(filePath, formData.profilePhoto);

            if (!uploadError) {
              const { data } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

              // Mettre à jour le profil avec l'URL de la photo
              await supabase
                .from('user_profiles')
                .update({ avatar_url: data.publicUrl })
                .eq('id', result.user.id);
            }
          } catch (uploadError) {
            console.warn('Erreur upload photo:', uploadError);
            // Ne pas bloquer l'inscription si l'upload échoue
          }
        }

        showSuccess('Inscription réussie ! Vérifiez votre email pour confirmer votre compte.');
        
        // Rediriger vers la page de connexion ou la propriété si un redirect est présent
        const redirect = searchParams.get('redirect');
        setTimeout(() => {
          if (redirect) {
            navigate(`/login?redirect=${encodeURIComponent(redirect)}`);
          } else {
            navigate('/login');
          }
        }, 2000);
      } else {
        setError('Erreur lors de la création du compte. Veuillez réessayer.');
      }
    } catch (error: any) {
      console.error('Erreur inscription:', error);
      let errorMessage = 'Erreur lors de l\'inscription';
      
      if (error.message) {
        if (error.message.includes('already registered') || error.message.includes('already exists')) {
          errorMessage = 'Cet email est déjà utilisé. Veuillez vous connecter ou utiliser un autre email.';
        } else if (error.message.includes('password')) {
          errorMessage = 'Le mot de passe ne respecte pas les critères requis.';
        } else if (error.message.includes('email')) {
          errorMessage = 'L\'adresse email n\'est pas valide.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const countries = [
    'République Démocratique du Congo',
    'Congo',
    'Cameroun',
    'Gabon',
    'Centrafrique',
    'Tchad',
    'Angola',
    'Burundi',
    'Rwanda',
    'Ouganda',
    'Tanzanie',
    'Autre'
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold font-heading text-primary">
            Créer un compte voyageur
          </h2>
          <p className="mt-2 text-sm text-secondary">
            Remplissez le formulaire ci-dessous pour créer votre compte
          </p>
        </div>

        <div className="bg-white shadow-xl rounded-2xl p-8 border border-light-gray">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Informations Personnelles */}
            <div>
              <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                1. Informations Personnelles
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-secondary mb-1">
                    Prénom *
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="w-full px-4 py-2 border border-light-gray rounded-lg focus:ring-2 focus:ring-primary"
                    placeholder="Votre prénom"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-secondary mb-1">
                    Nom *
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="w-full px-4 py-2 border border-light-gray rounded-lg focus:ring-2 focus:ring-primary"
                    placeholder="Votre nom"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-secondary mb-1">
                    Date de Naissance *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 w-5 h-5 text-secondary" />
                    <input
                      id="dateOfBirth"
                      type="date"
                      required
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                      className="w-full pl-10 pr-4 py-2 border border-light-gray rounded-lg focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Informations de Contact */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
                <Mail className="w-5 h-5 mr-2" />
                2. Informations de Contact
              </h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-secondary mb-1">
                    Adresse E-mail *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-secondary" />
                    <input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-light-gray rounded-lg focus:ring-2 focus:ring-primary"
                      placeholder="votre@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-secondary mb-1">
                    Numéro de Téléphone *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-5 h-5 text-secondary" />
                    <input
                      id="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-light-gray rounded-lg focus:ring-2 focus:ring-primary"
                      placeholder="+243 XXX XXX XXX"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-secondary mb-1">
                    Mot de Passe *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-secondary" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="w-full pl-10 pr-12 py-2 border border-light-gray rounded-lg focus:ring-2 focus:ring-primary"
                      placeholder="Minimum 8 caractères"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-secondary hover:text-primary"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-secondary mb-1">
                    Confirmer le Mot de Passe *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-secondary" />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className="w-full pl-10 pr-12 py-2 border border-light-gray rounded-lg focus:ring-2 focus:ring-primary"
                      placeholder="Confirmez votre mot de passe"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-secondary hover:text-primary"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Adresse */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                3. Adresse
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-secondary mb-1">
                    Pays *
                  </label>
                  <select
                    id="country"
                    required
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="w-full px-4 py-2 border border-light-gray rounded-lg focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Sélectionnez un pays</option>
                    {countries.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-secondary mb-1">
                    Ville *
                  </label>
                  <input
                    id="city"
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full px-4 py-2 border border-light-gray rounded-lg focus:ring-2 focus:ring-primary"
                    placeholder="Votre ville"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-secondary mb-1">
                    Adresse *
                  </label>
                  <input
                    id="address"
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full px-4 py-2 border border-light-gray rounded-lg focus:ring-2 focus:ring-primary"
                    placeholder="Votre adresse complète"
                  />
                </div>

                <div>
                  <label htmlFor="postalCode" className="block text-sm font-medium text-secondary mb-1">
                    Code Postal
                  </label>
                  <input
                    id="postalCode"
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    className="w-full px-4 py-2 border border-light-gray rounded-lg focus:ring-2 focus:ring-primary"
                    placeholder="Code postal (optionnel)"
                  />
                </div>
              </div>
            </div>

            {/* Vérification */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                4. Vérification
              </h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="profilePhoto" className="block text-sm font-medium text-secondary mb-1">
                    Photo de Profil
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <input
                        id="profilePhoto"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="profilePhoto"
                        className="cursor-pointer flex items-center space-x-2 px-4 py-2 border border-light-gray rounded-lg hover:bg-gray-50"
                      >
                        <Upload className="w-5 h-5 text-secondary" />
                        <span className="text-sm text-secondary">
                          {formData.profilePhoto ? formData.profilePhoto.name : 'Choisir une photo'}
                        </span>
                      </label>
                    </div>
                    {formData.profilePhoto && (
                      <span className="text-sm text-green-600 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Photo sélectionnée
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="captcha" className="block text-sm font-medium text-secondary mb-1">
                    Vérification Captcha *
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg font-mono text-lg font-bold">
                      {captchaValue} = ?
                    </div>
                    <input
                      id="captcha"
                      type="number"
                      required
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value)}
                      className="w-32 px-4 py-2 border border-light-gray rounded-lg focus:ring-2 focus:ring-primary"
                      placeholder="Réponse"
                    />
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="acceptTerms"
                      type="checkbox"
                      required
                      checked={formData.acceptTerms}
                      onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                      className="h-4 w-4 text-primary focus:ring-primary border-light-gray rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="acceptTerms" className="text-secondary">
                      J'accepte les{' '}
                      <Link to="/terms" className="font-medium text-primary hover:text-primary-light">
                        Termes et Conditions
                      </Link>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t">
              <Link
                to="/login"
                className="text-sm text-primary hover:text-primary-light"
              >
                Déjà un compte ? Se connecter
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-primary hover:bg-primary-light text-white'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Création du compte...
                  </div>
                ) : (
                  'Créer mon compte voyageur'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TravelerRegisterPage;

