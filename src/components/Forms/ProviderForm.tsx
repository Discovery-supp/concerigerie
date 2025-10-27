import React, { useState } from 'react';
import FormProgress from '../Common/FormProgress';
import { User, Briefcase, Settings, MapPin, DollarSign, Upload } from 'lucide-react';
import { ServiceProvider, FormStep } from '../../types';
import authService from '../../services/auth';
import serviceProvidersService from '../../services/serviceProviders';

const ProviderForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<Partial<ServiceProvider>>({
    // Informations personnelles
    civility: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    // Informations professionnelles
    company: '',
    experience: '',
    // Disponibilités
    availability: {},
    // Tarification
    hourlyRate: 0,
    // Zones d'intervention
    interventionZones: []
  });

  const [personalInfo, setPersonalInfo] = useState({
    gender: '',
    birthDate: '',
    secondaryPhone: '',
    address: '',
    postalCode: '',
    city: '',
    country: ''
  });

  const [professionalInfo, setProfessionalInfo] = useState({
    rccm: '',
    legalForm: '',
    taxNumber: '',
    description: ''
  });

  const [serviceInfo, setServiceInfo] = useState({
    mainServices: [] as string[],
    specialties: '',
    equipment: [] as string[],
    interventionTypes: [] as string[],
    weekendWork: false,
    eveningWork: false,
    eveningRate: 0
  });

  const [pricingInfo, setPricingInfo] = useState({
    flatRate: false,
    travelFee: 0,
    urgencyRate: 0,
    weekendRate: 0
  });

  const steps: FormStep[] = [
    { title: 'Informations personnelles', isCompleted: false, isActive: true },
    { title: 'Informations professionnelles', isCompleted: false, isActive: false },
    { title: 'Compétences et services', isCompleted: false, isActive: false },
    { title: 'Disponibilités et zones', isCompleted: false, isActive: false },
    { title: 'Tarification et documents', isCompleted: false, isActive: false },
  ];

  const mainServices = [
    {
      name: 'Plomberie',
      subServices: ['Fuites', 'Installations', 'WC', 'Robinetterie', 'Canalisations']
    },
    {
      name: 'Électricité',
      subServices: ['Dépannage', 'Installations', 'Tableaux électriques', 'Éclairage', 'Prises']
    },
    {
      name: 'Climatisation/Chauffage',
      subServices: ['Installation', 'Maintenance', 'Réparation', 'Nettoyage']
    },
    {
      name: 'Serrurerie',
      subServices: ['Ouverture de porte', 'Changement de serrure', 'Blindage', 'Dépannage']
    },
    {
      name: 'Menuiserie',
      subServices: ['Réparation', 'Installation', 'Sur mesure', 'Portes et fenêtres']
    },
    {
      name: 'Peinture',
      subServices: ['Intérieur', 'Extérieur', 'Rénovation', 'Décoration']
    },
    {
      name: 'Montage meubles',
      subServices: ['IKEA', 'Cuisine', 'Salle de bain', 'Bureau']
    },
    {
      name: 'Autre',
      subServices: []
    }
  ];

  const equipment = [
    'Véhicule utilitaire',
    'Outillage professionnel complet',
    'Équipements de sécurité',
    'Matériel spécifique'
  ];

  const interventionTypes = [
    'Dépannage d\'urgence',
    'Interventions programmées',
    'Conseils à distance'
  ];

  const daysOfWeek = [
    'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'
  ];

  const communes = [
    'Kinshasa', 'Gombe', 'Barumbu', 'Kinshasa Est', 'Lingwala', 'Kintambo',
    'Bandalungwa', 'Kalamu', 'Makala', 'Ngiri-Ngiri', 'Selembao', 'Bumbu',
    'Mont-Ngafula', 'Ngaliema', 'Lemba', 'Limete', 'Matete',
    'Ngaba', 'Masina', 'Ndjili', 'Nsele', 'Maluku'
  ];

  const legalForms = [
    'Auto-entrepreneur',
    'SARL',
    'SA',
    'SARLU',
    'Autre'
  ];

  const handlePersonalInfoChange = (field: string, value: any) => {
    setPersonalInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleProfessionalInfoChange = (field: string, value: any) => {
    setProfessionalInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleServiceInfoChange = (field: string, value: any) => {
    setServiceInfo(prev => ({ ...prev, [field]: value }));
  };

  const handlePricingInfoChange = (field: string, value: any) => {
    setPricingInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleFormDataChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayToggle = (field: string, value: string, setState: React.Dispatch<React.SetStateAction<any>>) => {
    setState((prev: any) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item: string) => item !== value)
        : [...prev[field], value]
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
              <User className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Identité du prestataire</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Civilité</label>
                <select
                  value={formData.civility}
                  onChange={(e) => handleFormDataChange('civility', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sélectionner</option>
                  <option value="M">M.</option>
                  <option value="Mme">Mme</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleFormDataChange('firstName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleFormDataChange('lastName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date de naissance</label>
                <input
                  type="date"
                  value={personalInfo.birthDate}
                  onChange={(e) => handlePersonalInfoChange('birthDate', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Numéro de téléphone principal</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleFormDataChange('phone', e.target.value)}
                  placeholder="+243 XXX XXX XXX"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Numéro de téléphone secondaire (optionnel)</label>
                <input
                  type="tel"
                  value={personalInfo.secondaryPhone}
                  onChange={(e) => handlePersonalInfoChange('secondaryPhone', e.target.value)}
                  placeholder="+243 XXX XXX XXX"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Adresse email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFormDataChange('email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Adresse postale complète</label>
              <input
                type="text"
                value={personalInfo.address}
                onChange={(e) => handlePersonalInfoChange('address', e.target.value)}
                placeholder="123 Avenue de la République, Commune..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Code postal</label>
                <input
                  type="text"
                  value={personalInfo.postalCode}
                  onChange={(e) => handlePersonalInfoChange('postalCode', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ville</label>
                <input
                  type="text"
                  value={personalInfo.city}
                  onChange={(e) => handlePersonalInfoChange('city', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pays</label>
                <input
                  type="text"
                  value={personalInfo.country}
                  onChange={(e) => handlePersonalInfoChange('country', e.target.value)}
                  placeholder="République Démocratique du Congo"
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
              <Briefcase className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Votre activité professionnelle</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'entreprise (si applicable)
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleFormDataChange('company', e.target.value)}
                  placeholder="Entreprise individuelle ou nom de société"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Numéro RCCM</label>
                <input
                  type="text"
                  value={professionalInfo.rccm}
                  onChange={(e) => handleProfessionalInfoChange('rccm', e.target.value)}
                  placeholder="CD/KIN/RCCM/XX-XXXX"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Forme juridique</label>
                <select
                  value={professionalInfo.legalForm}
                  onChange={(e) => handleProfessionalInfoChange('legalForm', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sélectionner</option>
                  {legalForms.map(form => (
                    <option key={form} value={form}>{form}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Numéro d'impôt</label>
                <input
                  type="text"
                  value={professionalInfo.taxNumber}
                  onChange={(e) => handleProfessionalInfoChange('taxNumber', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Années d'expérience</label>
              <select
                value={formData.experience}
                onChange={(e) => handleFormDataChange('experience', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sélectionner</option>
                <option value="0-1">0-1 an</option>
                <option value="2-5">2-5 ans</option>
                <option value="5-10">5-10 ans</option>
                <option value="10+">10+ ans</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description de votre activité (500 caractères max)
              </label>
              <textarea
                value={professionalInfo.description}
                onChange={(e) => handleProfessionalInfoChange('description', e.target.value)}
                maxLength={500}
                rows={4}
                placeholder="Décrivez votre expertise, vos spécialités, votre approche..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <div className="text-right text-xs text-gray-500 mt-1">
                {professionalInfo.description.length}/500 caractères
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <Settings className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Vos domaines d'intervention</h2>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Compétences principales</h3>
              <div className="space-y-4">
                {mainServices.map(service => (
                  <div key={service.name} className="border border-gray-300 rounded-lg p-4">
                    <label className="flex items-center mb-3">
                      <input
                        type="checkbox"
                        checked={serviceInfo.mainServices.includes(service.name)}
                        onChange={() => handleArrayToggle('mainServices', service.name, setServiceInfo)}
                        className="mr-3 text-blue-600 rounded"
                      />
                      <span className="font-medium text-gray-900">{service.name}</span>
                    </label>
                    
                    {serviceInfo.mainServices.includes(service.name) && service.subServices.length > 0 && (
                      <div className="ml-6 grid grid-cols-2 md:grid-cols-3 gap-2">
                        {service.subServices.map(subService => (
                          <label key={subService} className="flex items-center text-sm">
                            <input
                              type="checkbox"
                              className="mr-2 text-blue-600 rounded"
                            />
                            <span className="text-gray-700">{subService}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Spécialités</label>
              <input
                type="text"
                value={serviceInfo.specialties}
                onChange={(e) => handleServiceInfoChange('specialties', e.target.value)}
                placeholder="Ex: Domotique, systèmes de sécurité, énergies renouvelables..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Matériel disponible</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {equipment.map(item => (
                  <label key={item} className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                    <input
                      type="checkbox"
                      checked={serviceInfo.equipment.includes(item)}
                      onChange={() => handleArrayToggle('equipment', item, setServiceInfo)}
                      className="mr-3 text-blue-600 rounded"
                    />
                    <span className="text-gray-700">{item}</span>
                  </label>
                ))}
              </div>
              
              <div className="mt-4">
                <input
                  type="text"
                  placeholder="Matériel spécifique (préciser)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Types d'intervention</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {interventionTypes.map(type => (
                  <label key={type} className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                    <input
                      type="checkbox"
                      checked={serviceInfo.interventionTypes.includes(type)}
                      onChange={() => handleArrayToggle('interventionTypes', type, setServiceInfo)}
                      className="mr-3 text-blue-600 rounded"
                    />
                    <span className="text-gray-700 text-sm">{type}</span>
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
              <MapPin className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Quand et où intervenez-vous ?</h2>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Disponibilités</h3>
              
              <div className="space-y-4">
                {daysOfWeek.map(day => (
                  <div key={day} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-20">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="mr-2 text-blue-600 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">{day}</span>
                      </label>
                    </div>
                    <div className="flex items-center space-x-2 flex-1">
                      <input
                        type="time"
                        defaultValue="08:00"
                        className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      <span className="text-gray-500">à</span>
                      <input
                        type="time"
                        defaultValue="18:00"
                        className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                  <input
                    type="checkbox"
                    checked={serviceInfo.weekendWork}
                    onChange={(e) => handleServiceInfoChange('weekendWork', e.target.checked)}
                    className="mr-3 text-blue-600 rounded"
                  />
                  <span className="text-gray-700">Interventions le week-end</span>
                </label>
                <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                  <input
                    type="checkbox"
                    checked={serviceInfo.eveningWork}
                    onChange={(e) => handleServiceInfoChange('eveningWork', e.target.checked)}
                    className="mr-3 text-blue-600 rounded"
                  />
                  <span className="text-gray-700">Interventions en soirée</span>
                </label>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Zones d'intervention</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rayon d'intervention (Communes/Villes)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-60 overflow-y-auto border border-gray-300 rounded-lg p-4">
                  {communes.map((commune, index) => (
                    <label key={`${commune}-${index}`} className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={formData.interventionZones?.includes(commune) || false}
                        onChange={() => {
                          const zones = formData.interventionZones || [];
                          handleFormDataChange('interventionZones', 
                            zones.includes(commune) 
                              ? zones.filter(z => z !== commune)
                              : [...zones, commune]
                          );
                        }}
                        className="mr-2 text-blue-600 rounded"
                      />
                      <span className="text-gray-700">{commune}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <DollarSign className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Tarification et documents</h2>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tarification</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tarif horaire (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-500">$</span>
                    <input
                      type="number"
                      value={formData.hourlyRate}
                      onChange={(e) => handleFormDataChange('hourlyRate', parseFloat(e.target.value) || 0)}
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frais de déplacement (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-500">$</span>
                    <input
                      type="number"
                      value={pricingInfo.travelFee}
                      onChange={(e) => handlePricingInfoChange('travelFee', parseFloat(e.target.value) || 0)}
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                  <input
                    type="checkbox"
                    checked={pricingInfo.flatRate}
                    onChange={(e) => handlePricingInfoChange('flatRate', e.target.checked)}
                    className="mr-3 text-blue-600 rounded"
                  />
                  <span className="text-gray-700">Tarif forfaitaire disponible (négociable selon l'intervention)</span>
                </label>
              </div>

            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents à fournir</h3>
              
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <h4 className="font-medium text-gray-900 mb-1">Pièce d'identité (recto-verso)</h4>
                  <p className="text-sm text-gray-600 mb-3">Passeport, carte d'identité ou permis de conduire</p>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                    Télécharger
                  </button>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <h4 className="font-medium text-gray-900 mb-1">Diplômes/Certifications</h4>
                  <p className="text-sm text-gray-600 mb-3">Attestations de formation, certificats professionnels</p>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                    Télécharger (optionnel)
                  </button>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <h4 className="font-medium text-gray-900 mb-1">Photos de réalisations</h4>
                  <p className="text-sm text-gray-600 mb-3">Exemples de vos travaux (avant/après)</p>
                  <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm">
                    Télécharger (optionnel)
                  </button>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Références clients (optionnel)
                </label>
                <textarea
                  rows={3}
                  placeholder="Noms et contacts de clients précédents qui peuvent témoigner de la qualité de vos services..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
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
                  de Nzoo Immo Conciergerie
                </span>
              </label>
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  className="mt-1 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">
                  Je certifie l'exactitude des informations fournies et m'engage à maintenir 
                  mes compétences et certifications à jour
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
              Devenez Prestataire de Services
            </h1>
            <p className="text-gray-600">
              Rejoignez notre réseau de prestataires qualifiés et développez votre activité avec Nzoo Immo
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
                {isLoading ? 'Inscription...' : (currentStep === steps.length - 1 ? 'Soumettre ma candidature' : 'Suivant')}
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
      // Créer d'abord l'utilisateur
      const userData = await authService.signUp(
        formData.email || '',
        'TempPassword123!', // Mot de passe temporaire
        {
          firstName: formData.firstName || '',
          lastName: formData.lastName || '',
          phone: formData.phone || '',
          userType: 'provider'
        }
      );

      if (userData?.user) {
        // Créer le profil prestataire
        const providerData = {
          user_id: userData.user.id,
          company: formData.company,
          experience: formData.experience || '',
          services: serviceInfo.mainServices,
          availability: {},
          hourly_rate: formData.hourlyRate || 0,
          intervention_zones: formData.interventionZones || [],
          documents: [],
          is_verified: false,
          rating: 0,
          completed_jobs: 0
        };

        await serviceProvidersService.createServiceProvider(providerData);
        
        alert('Candidature prestataire soumise avec succès ! Nous examinerons votre dossier sous 48h.');
        window.location.href = '/login';
      }
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la soumission');
    } finally {
      setIsLoading(false);
    }
  }
};

export default ProviderForm;