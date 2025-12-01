import React, { useState } from 'react';
import FormProgress from '../components/Common/FormProgress';
import { Building, Users, Handshake, TrendingUp, Globe } from 'lucide-react';
import { FormStep } from '../types';
import authService from '../services/auth';

const PartnerForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    // Informations entreprise
    companyName: '',
    companyType: '',
    registrationNumber: '',
    taxNumber: '',
    establishedYear: '',
    employeeCount: '',
    website: '',
    
    // Contact principal
    contactFirstName: '',
    contactLastName: '',
    contactPosition: '',
    contactEmail: '',
    contactPhone: '',
    
    // Adresse
    address: '',
    city: '',
    country: '',
    postalCode: '',
    
    // Activité
    businessSector: '',
    services: [] as string[],
    targetMarket: '',
    currentClients: '',
    
    // Partenariat
    partnershipType: '',
    expectedVolume: '',
    marketingBudget: '',
    exclusivity: false,
    
    // Documents
    businessLicense: '',
    insuranceCertificate: '',
    references: ''
  });

  const steps: FormStep[] = [
    { title: 'Informations entreprise', isCompleted: false, isActive: true },
    { title: 'Contact et localisation', isCompleted: false, isActive: false },
    { title: 'Activité et services', isCompleted: false, isActive: false },
    { title: 'Type de partenariat', isCompleted: false, isActive: false },
  ];

  const companyTypes = [
    'SARL', 'SA', 'SARLU', 'SNC', 'SCS', 'Entreprise individuelle', 'Coopérative', 'ONG', 'Autre'
  ];

  const businessSectors = [
    'Tourisme et Voyage',
    'Hôtellerie et Restauration',
    'Transport',
    'Immobilier',
    'Services financiers',
    'Technologie',
    'Commerce',
    'Industrie',
    'Autre'
  ];

  const servicesList = [
    'Agence de voyage',
    'Transport touristique',
    'Guide touristique',
    'Restauration',
    'Événementiel',
    'Services financiers',
    'Assurance voyage',
    'Location de véhicules',
    'Services de conciergerie',
    'Activités de loisirs',
    'Spa et bien-être',
    'Shopping et artisanat'
  ];

  const partnershipTypes = [
    'Partenaire commercial',
    'Fournisseur de services',
    'Distributeur',
    'Revendeur',
    'Partenaire technologique',
    'Partenaire marketing'
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleServiceToggle = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
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
              <Building className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Informations sur votre entreprise</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'entreprise
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type d'entreprise
                </label>
                <select
                  value={formData.companyType}
                  onChange={(e) => handleInputChange('companyType', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sélectionner</option>
                  {companyTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro d'enregistrement (RCCM)
                </label>
                <input
                  type="text"
                  value={formData.registrationNumber}
                  onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                  placeholder="CD/KIN/RCCM/XX-XXXX"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro d'identification fiscale
                </label>
                <input
                  type="text"
                  value={formData.taxNumber}
                  onChange={(e) => handleInputChange('taxNumber', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Année de création
                </label>
                <input
                  type="number"
                  value={formData.establishedYear}
                  onChange={(e) => handleInputChange('establishedYear', e.target.value)}
                  min="1900"
                  max="2025"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre d'employés
                </label>
                <select
                  value={formData.employeeCount}
                  onChange={(e) => handleInputChange('employeeCount', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sélectionner</option>
                  <option value="1-5">1-5 employés</option>
                  <option value="6-20">6-20 employés</option>
                  <option value="21-50">21-50 employés</option>
                  <option value="51-100">51-100 employés</option>
                  <option value="100+">Plus de 100 employés</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Site web (optionnel)
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://www.exemple.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <Users className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Contact principal et localisation</h2>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Personne de contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                  <input
                    type="text"
                    value={formData.contactFirstName}
                    onChange={(e) => handleInputChange('contactFirstName', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                  <input
                    type="text"
                    value={formData.contactLastName}
                    onChange={(e) => handleInputChange('contactLastName', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Poste/Fonction</label>
                  <input
                    type="text"
                    value={formData.contactPosition}
                    onChange={(e) => handleInputChange('contactPosition', e.target.value)}
                    placeholder="Ex: Directeur commercial"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email professionnel</label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    placeholder="+243 XXX XXX XXX"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Adresse de l'entreprise</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Adresse complète</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="123 Avenue de la République, Commune..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ville</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pays</label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      placeholder="République Démocratique du Congo"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Code postal</label>
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => handleInputChange('postalCode', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <Globe className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Votre activité et services</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secteur d'activité principal
              </label>
              <select
                value={formData.businessSector}
                onChange={(e) => handleInputChange('businessSector', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sélectionner un secteur</option>
                {businessSectors.map(sector => (
                  <option key={sector} value={sector}>{sector}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Services proposés (sélection multiple)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {servicesList.map(service => (
                  <label key={service} className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.services.includes(service)}
                      onChange={() => handleServiceToggle(service)}
                      className="mr-3 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">{service}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marché cible
                </label>
                <select
                  value={formData.targetMarket}
                  onChange={(e) => handleInputChange('targetMarket', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sélectionner</option>
                  <option value="local">Marché local (RDC)</option>
                  <option value="regional">Marché régional (Afrique Centrale)</option>
                  <option value="international">Marché international</option>
                  <option value="mixed">Marché mixte</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de clients actuels
                </label>
                <select
                  value={formData.currentClients}
                  onChange={(e) => handleInputChange('currentClients', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sélectionner</option>
                  <option value="0-50">0-50 clients</option>
                  <option value="51-200">51-200 clients</option>
                  <option value="201-500">201-500 clients</option>
                  <option value="500+">Plus de 500 clients</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <Handshake className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Type de partenariat souhaité</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de partenariat
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {partnershipTypes.map(type => (
                  <label key={type} className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                    <input
                      type="radio"
                      name="partnershipType"
                      value={type}
                      checked={formData.partnershipType === type}
                      onChange={(e) => handleInputChange('partnershipType', e.target.value)}
                      className="mr-3 text-blue-600"
                    />
                    <span className="text-gray-700">{type}</span>
                  </label>
                ))}
              </div>
            </div>


            <div>
              <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.exclusivity}
                  onChange={(e) => handleInputChange('exclusivity', e.target.checked)}
                  className="mr-3 text-blue-600 rounded"
                />
                <div>
                  <span className="font-medium text-gray-900">Partenariat exclusif</span>
                  <p className="text-sm text-gray-600">
                    Je souhaite un partenariat exclusif dans ma zone géographique
                  </p>
                </div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Références clients (optionnel)
              </label>
              <textarea
                value={formData.references}
                onChange={(e) => handleInputChange('references', e.target.value)}
                rows={4}
                placeholder="Noms et contacts de clients qui peuvent témoigner de la qualité de vos services..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="space-y-3 bg-gray-50 rounded-lg p-6">
              <h4 className="font-medium text-gray-900">Conditions générales</h4>
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  className="mt-1 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">
                  J'accepte les{' '}
                  <a href="#" className="text-blue-600 hover:underline">conditions générales</a>{' '}
                  de partenariat avec Nzoo Immo Conciergerie
                </span>
              </label>
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  className="mt-1 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">
                  Je certifie l'exactitude des informations fournies et m'engage à respecter 
                  les standards de qualité de Nzoo Immo
                </span>
              </label>
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
              Devenir Partenaire
            </h1>
            <p className="text-gray-600">
              Rejoignez notre réseau de partenaires et développez votre activité avec Nzoo Immo
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
                {isLoading ? 'Soumission...' : (currentStep === steps.length - 1 ? 'Soumettre ma candidature' : 'Suivant')}
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
      // Créer l'utilisateur partenaire
      const userData = await authService.signUp(
        formData.contactEmail,
        'TempPassword123!', // Mot de passe temporaire
        {
          firstName: formData.contactFirstName,
          lastName: formData.contactLastName,
          phone: formData.contactPhone,
          userType: 'partner'
        }
      );

      if (userData?.user) {
        // Ici vous pourriez créer une table partners si nécessaire
        // Pour l'instant, on stocke juste l'utilisateur avec le type 'partner'
        
        alert('Candidature partenaire soumise avec succès ! Nous vous recontacterons sous 48h.');
        window.location.href = '/login';
      }
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la soumission');
    } finally {
      setIsLoading(false);
    }
  }
};

export default PartnerForm;