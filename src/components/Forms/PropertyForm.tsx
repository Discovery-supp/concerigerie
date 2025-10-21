import React, { useState } from 'react';
import FormProgress from '../Common/FormProgress';
import Counter from '../Common/Counter';
import { Upload, X, Home, MapPin, Wrench, Camera, DollarSign } from 'lucide-react';
import { Property, FormStep } from '../../types';
import { supabase } from '../../lib/supabase';
import propertiesService from '../../services/properties';

const PropertyForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<Partial<Property>>({
    type: '',
    title: '',
    description: '',
    maxGuests: 1,
    bedrooms: 1,
    bathrooms: 1,
    beds: 1,
    address: '',
    surface: 0,
    pricePerNight: 0,
    cleaningFee: 0,
    minNights: 1,
    maxNights: 30,
    amenities: [],
    images: [],
    rules: [],
    cancellationPolicy: 'flexible',
    checkInTime: '15:00',
    checkOutTime: '11:00'
  });

  const steps: FormStep[] = [
    { title: 'Informations de base', isCompleted: false, isActive: true },
    { title: 'Détails de la propriété', isCompleted: false, isActive: false },
    { title: 'Équipements et services', isCompleted: false, isActive: false },
    { title: 'Photos', isCompleted: false, isActive: false },
    { title: 'Tarifs et disponibilités', isCompleted: false, isActive: false },
  ];

  const propertyTypes = [
    'Maison entière',
    'Appartement',
    'Chambre privée',
    'Chambre partagée',
    'Villa',
    'Studio',
    'Loft'
  ];

  const basicAmenities = [
    'Wi-Fi',
    'Cuisine',
    'Télévision',
    'Parking gratuit',
    'Climatisation',
    'Chauffage'
  ];

  const additionalAmenities = [
    'Piscine',
    'Jacuzzi',
    'Salle de sport',
    'Petit déjeuner',
    'Espace de travail',
    'Cheminée'
  ];

  const includedServices = [
    'Draps et serviettes',
    'Service de ménage',
    'Arrivée autonome'
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities?.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...(prev.amenities || []), amenity]
    }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <Home className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Informations de base</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de propriété
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sélectionnez un type</option>
                {propertyTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titre de l'annonce
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Ex: Magnifique appartement avec vue sur le fleuve Congo"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={5}
                placeholder="Décrivez votre propriété, ses atouts, le quartier..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Counter
                label="Voyageurs"
                value={formData.maxGuests || 1}
                min={1}
                max={20}
                onChange={(value) => handleInputChange('maxGuests', value)}
              />
              <Counter
                label="Chambres"
                value={formData.bedrooms || 0}
                min={0}
                max={20}
                onChange={(value) => handleInputChange('bedrooms', value)}
              />
              <Counter
                label="Lits"
                value={formData.beds || 1}
                min={1}
                max={30}
                onChange={(value) => handleInputChange('beds', value)}
              />
              <Counter
                label="Salles de bain"
                value={formData.bathrooms || 1}
                min={1}
                max={10}
                onChange={(value) => handleInputChange('bathrooms', value)}
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <MapPin className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Détails de la propriété</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse complète
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="123 Avenue de la République, Kinshasa, RDC"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Superficie (m²)
                </label>
                <input
                  type="number"
                  value={formData.surface}
                  onChange={(e) => handleInputChange('surface', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de logement
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['Logement entier', 'Chambre privée', 'Chambre partagée'].map(type => (
                  <label key={type} className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                    <input
                      type="radio"
                      name="accommodationType"
                      value={type}
                      className="mr-3 text-blue-600"
                    />
                    <span className="text-gray-700">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heure d'arrivée
                </label>
                <input
                  type="time"
                  value={formData.checkInTime}
                  onChange={(e) => handleInputChange('checkInTime', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heure de départ
                </label>
                <input
                  type="time"
                  value={formData.checkOutTime}
                  onChange={(e) => handleInputChange('checkOutTime', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <Wrench className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Équipements et services</h2>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Équipements de base</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {basicAmenities.map(amenity => (
                  <label key={amenity} className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.amenities?.includes(amenity) || false}
                      onChange={() => handleAmenityToggle(amenity)}
                      className="mr-3 text-blue-600 rounded"
                    />
                    <span className="text-gray-700 text-sm">{amenity}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Équipements supplémentaires</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {additionalAmenities.map(amenity => (
                  <label key={amenity} className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.amenities?.includes(amenity) || false}
                      onChange={() => handleAmenityToggle(amenity)}
                      className="mr-3 text-blue-600 rounded"
                    />
                    <span className="text-gray-700 text-sm">{amenity}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Services inclus</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {includedServices.map(service => (
                  <label key={service} className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                    <input
                      type="checkbox"
                      className="mr-3 text-blue-600 rounded"
                    />
                    <span className="text-gray-700 text-sm">{service}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Politique d'annulation</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['flexible', 'modérée', 'stricte'].map(policy => (
                  <label key={policy} className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                    <input
                      type="radio"
                      name="cancellationPolicy"
                      value={policy}
                      checked={formData.cancellationPolicy === policy}
                      onChange={(e) => handleInputChange('cancellationPolicy', e.target.value)}
                      className="mr-3 text-blue-600"
                    />
                    <span className="text-gray-700 capitalize">{policy}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <Camera className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Photos de votre propriété</h2>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                Glissez-déposez vos photos ici
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Formats acceptés : JPG, PNG (max 10MB par photo)
              </p>
              <button
                type="button"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Parcourir les fichiers
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(index => (
                <div key={index} className="aspect-square bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center relative group">
                  <Camera className="w-8 h-8 text-gray-400" />
                  <button className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hidden">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <DollarSign className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Tarifs et disponibilités</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prix par nuit (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">$</span>
                  <input
                    type="number"
                    value={formData.pricePerNight}
                    onChange={(e) => handleInputChange('pricePerNight', parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frais de ménage (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">$</span>
                  <input
                    type="number"
                    value={formData.cleaningFee}
                    onChange={(e) => handleInputChange('cleaningFee', parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Counter
                label="Nuitées minimum"
                value={formData.minNights || 1}
                min={1}
                max={30}
                onChange={(value) => handleInputChange('minNights', value)}
              />
              <Counter
                label="Nuitées maximum"
                value={formData.maxNights || 30}
                min={1}
                max={365}
                onChange={(value) => handleInputChange('maxNights', value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remise pour séjours longs (%)
              </label>
              <input
                type="number"
                placeholder="Ex: 10% pour séjours de 7 nuits+"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Aperçu des prix</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>3 nuits × ${formData.pricePerNight || 0}</span>
                  <span>${((formData.pricePerNight || 0) * 3).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Frais de ménage</span>
                  <span>${(formData.cleaningFee || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Frais de service (12%)</span>
                  <span>${(((formData.pricePerNight || 0) * 3 + (formData.cleaningFee || 0)) * 0.12).toFixed(2)}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${(((formData.pricePerNight || 0) * 3 + (formData.cleaningFee || 0)) * 1.12).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Enregistrement d'annonce Airbnb
            </h1>
            <p className="text-gray-600">
              Créez votre annonce en quelques étapes simples
            </p>
          </div>

          <FormProgress steps={steps} currentStep={currentStep} />

          <form onSubmit={(e) => e.preventDefault()}>
            {renderStepContent()}

            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 0}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  currentStep === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Retour
              </button>

              <button
                type="button"
                onClick={currentStep === steps.length - 1 ? handleSubmit : nextStep}
                disabled={isLoading}
                className={`px-8 py-3 font-semibold rounded-lg transition-all shadow-lg ${
                  isLoading 
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-primary-light'
                }`}
              >
                {isLoading ? 'Publication...' : (currentStep === steps.length - 1 ? 'Publier l\'annonce' : 'Suivant')}
              </button>
            </div>
            
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {error}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );

  async function handleSubmit() {
    setIsLoading(true);
    setError('');
    
    try {
      // Récupérer l'utilisateur actuel
      const { user } = await supabase.auth.getUser();
      
      if (!user.data.user) {
        setError('Vous devez être connecté pour publier une annonce');
        return;
      }

      const propertyData = {
        owner_id: user.data.user.id,
        title: formData.title || '',
        description: formData.description || '',
        type: formData.type || '',
        address: formData.address || '',
        surface: formData.surface || 0,
        max_guests: formData.maxGuests || 1,
        bedrooms: formData.bedrooms || 0,
        bathrooms: formData.bathrooms || 1,
        beds: formData.beds || 1,
        price_per_night: formData.pricePerNight || 0,
        cleaning_fee: formData.cleaningFee || 0,
        min_nights: formData.minNights || 1,
        max_nights: formData.maxNights || 30,
        amenities: formData.amenities || [],
        images: formData.images || [],
        rules: formData.rules || [],
        cancellation_policy: formData.cancellationPolicy || 'flexible',
        check_in_time: formData.checkInTime || '15:00',
        check_out_time: formData.checkOutTime || '11:00',
        category: 'Standard',
        neighborhood: 'Kinshasa',
        beach_access: false
      };

      const newProperty = await propertiesService.createProperty(propertyData);
      
      alert('Annonce publiée avec succès !');
      // Rediriger vers la page des propriétés ou le dashboard
      window.location.href = '/properties';
      
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la publication de l\'annonce');
    } finally {
      setIsLoading(false);
    }
  }
};

export default PropertyForm;