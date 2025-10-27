import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Upload, MapPin, Home, Users, Bed, Bath, Wifi, Car, Coffee, Shield, Star, Edit, Trash2, Eye, EyeOff } from 'lucide-react';

interface Property {
  id?: string;
  title: string;
  description: string;
  type: string;
  address: string;
  surface: number;
  max_guests: number;
  bedrooms: number;
  bathrooms: number;
  beds: number;
  price_per_night: number;
  cleaning_fee: number;
  min_nights: number;
  max_nights: number;
  amenities: string[];
  images: string[];
  rules: string[];
  cancellation_policy: string;
  check_in_time: string;
  check_out_time: string;
  category: string;
  neighborhood: string;
  beach_access: boolean;
  is_published: boolean;
}

interface PropertyManagementFormProps {
  propertyId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const PropertyManagementForm: React.FC<PropertyManagementFormProps> = ({
  propertyId,
  onSuccess,
  onCancel
}) => {
  const [property, setProperty] = useState<Property>({
    title: '',
    description: '',
    type: 'appartement',
    address: '',
    surface: 0,
    max_guests: 1,
    bedrooms: 1,
    bathrooms: 1,
    beds: 1,
    price_per_night: 0,
    cleaning_fee: 0,
    min_nights: 1,
    max_nights: 30,
    amenities: [],
    images: [],
    rules: [],
    cancellation_policy: 'moderate',
    check_in_time: '15:00',
    check_out_time: '11:00',
    category: 'logement',
    neighborhood: '',
    beach_access: false,
    is_published: false
  });

  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [newRule, setNewRule] = useState('');
  const [newImage, setNewImage] = useState('');

  const propertyTypes = [
    'appartement', 'maison', 'studio', 'villa', 'chambre', 'loft', 'penthouse'
  ];

  const amenityOptions = [
    'WiFi', 'Climatisation', 'Chauffage', 'Parking', 'Piscine', 'Jardin',
    'Balcon', 'Terrasse', 'Cuisine équipée', 'Lave-linge', 'Sèche-linge',
    'TV', 'Netflix', 'PlayStation', 'Jacuzzi', 'Sauna', 'Gym', 'Ascenseur',
    'Concierge', 'Sécurité', 'Animaux acceptés', 'Non-fumeur'
  ];

  const cancellationPolicies = [
    { value: 'flexible', label: 'Flexible - Remboursement complet jusqu\'à 24h avant' },
    { value: 'moderate', label: 'Modérée - Remboursement complet jusqu\'à 5 jours avant' },
    { value: 'strict', label: 'Stricte - Remboursement de 50% jusqu\'à 1 semaine avant' }
  ];

  useEffect(() => {
    if (propertyId) {
      loadProperty();
    }
  }, [propertyId]);

  const loadProperty = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();

      if (error) throw error;
      if (data) {
        setProperty(data);
      }
    } catch (error) {
      console.error('Erreur chargement propriété:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      const propertyData = {
        ...property,
        owner_id: user.id,
        updated_at: new Date().toISOString()
      };

      if (propertyId) {
        const { error } = await supabase
          .from('properties')
          .update(propertyData)
          .eq('id', propertyId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('properties')
          .insert([propertyData]);

        if (error) throw error;
      }

      onSuccess?.();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const addRule = () => {
    if (newRule.trim()) {
      setProperty(prev => ({
        ...prev,
        rules: [...prev.rules, newRule.trim()]
      }));
      setNewRule('');
    }
  };

  const removeRule = (index: number) => {
    setProperty(prev => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index)
    }));
  };

  const addImage = () => {
    if (newImage.trim()) {
      setProperty(prev => ({
        ...prev,
        images: [...prev.images, newImage.trim()]
      }));
      setNewImage('');
    }
  };

  const removeImage = (index: number) => {
    setProperty(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const toggleAmenity = (amenity: string) => {
    setProperty(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const togglePublish = () => {
    setProperty(prev => ({
      ...prev,
      is_published: !prev.is_published
    }));
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {propertyId ? 'Modifier la propriété' : 'Nouvelle propriété'}
        </h2>
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2">
            {[1, 2, 3, 4].map(step => (
              <div
                key={step}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step}
              </div>
            ))}
          </div>
          <div className="text-sm text-gray-600">
            Étape {currentStep} sur 4
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Étape 1: Informations de base */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Informations de base</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre de l'annonce *
                </label>
                <input
                  type="text"
                  value={property.title}
                  onChange={(e) => setProperty(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de propriété *
                </label>
                <select
                  value={property.type}
                  onChange={(e) => setProperty(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {propertyTypes.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={property.description}
                  onChange={(e) => setProperty(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse complète *
                </label>
                <input
                  type="text"
                  value={property.address}
                  onChange={(e) => setProperty(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Surface (m²) *
                </label>
                <input
                  type="number"
                  value={property.surface}
                  onChange={(e) => setProperty(prev => ({ ...prev, surface: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quartier
                </label>
                <input
                  type="text"
                  value={property.neighborhood}
                  onChange={(e) => setProperty(prev => ({ ...prev, neighborhood: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Étape 2: Capacité et équipements */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Capacité et équipements</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invités maximum *
                </label>
                <input
                  type="number"
                  value={property.max_guests}
                  onChange={(e) => setProperty(prev => ({ ...prev, max_guests: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chambres *
                </label>
                <input
                  type="number"
                  value={property.bedrooms}
                  onChange={(e) => setProperty(prev => ({ ...prev, bedrooms: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salles de bain *
                </label>
                <input
                  type="number"
                  value={property.bathrooms}
                  onChange={(e) => setProperty(prev => ({ ...prev, bathrooms: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lits *
                </label>
                <input
                  type="number"
                  value={property.beds}
                  onChange={(e) => setProperty(prev => ({ ...prev, beds: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Équipements disponibles
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {amenityOptions.map(amenity => (
                  <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={property.amenities.includes(amenity)}
                      onChange={() => toggleAmenity(amenity)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{amenity}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={property.beach_access}
                onChange={(e) => setProperty(prev => ({ ...prev, beach_access: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label className="text-sm text-gray-700">Accès à la plage</label>
            </div>
          </div>
        )}

        {/* Étape 3: Tarifs et disponibilités */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Tarifs et disponibilités</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prix par nuit (€) *
                </label>
                <input
                  type="number"
                  value={property.price_per_night}
                  onChange={(e) => setProperty(prev => ({ ...prev, price_per_night: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frais de ménage (€)
                </label>
                <input
                  type="number"
                  value={property.cleaning_fee}
                  onChange={(e) => setProperty(prev => ({ ...prev, cleaning_fee: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nuits minimum *
                </label>
                <input
                  type="number"
                  value={property.min_nights}
                  onChange={(e) => setProperty(prev => ({ ...prev, min_nights: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nuits maximum
                </label>
                <input
                  type="number"
                  value={property.max_nights}
                  onChange={(e) => setProperty(prev => ({ ...prev, max_nights: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heure d'arrivée
                </label>
                <input
                  type="time"
                  value={property.check_in_time}
                  onChange={(e) => setProperty(prev => ({ ...prev, check_in_time: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heure de départ
                </label>
                <input
                  type="time"
                  value={property.check_out_time}
                  onChange={(e) => setProperty(prev => ({ ...prev, check_out_time: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Politique d'annulation *
              </label>
              <select
                value={property.cancellation_policy}
                onChange={(e) => setProperty(prev => ({ ...prev, cancellation_policy: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {cancellationPolicies.map(policy => (
                  <option key={policy.value} value={policy.value}>
                    {policy.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Étape 4: Règles et images */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Règles et images</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Règles de la maison
              </label>
              <div className="space-y-2">
                {property.rules.map((rule, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="flex-1 px-3 py-2 bg-gray-100 rounded-md">{rule}</span>
                    <button
                      type="button"
                      onClick={() => removeRule(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newRule}
                    onChange={(e) => setNewRule(e.target.value)}
                    placeholder="Ajouter une règle..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={addRule}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Images de la propriété
              </label>
              <div className="space-y-2">
                {property.images.map((image, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="flex-1 px-3 py-2 bg-gray-100 rounded-md truncate">{image}</span>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div className="flex space-x-2">
                  <input
                    type="url"
                    value={newImage}
                    onChange={(e) => setNewImage(e.target.value)}
                    placeholder="URL de l'image..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={addImage}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={togglePublish}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    property.is_published ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      property.is_published ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {property.is_published ? 'Publié' : 'Brouillon'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {property.is_published ? 'Visible par les voyageurs' : 'Non visible'}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {property.is_published ? (
                  <Eye className="w-5 h-5 text-green-600" />
                ) : (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-6 border-t">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Précédent
              </button>
            )}
          </div>
          <div className="flex space-x-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
            )}
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Suivant
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Sauvegarde...' : propertyId ? 'Mettre à jour' : 'Créer la propriété'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default PropertyManagementForm;


