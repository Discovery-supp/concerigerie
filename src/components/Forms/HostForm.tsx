import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PersonalInfoStep from './Steps/PersonalInfoStep';
import PresentationStep from './Steps/PresentationStep';
import PreparationStep from './Steps/PreparationStep';
import PaymentStep from './Steps/PaymentStep';
import FormProgress from '../Common/FormProgress';
import { User, Home, Shield, Users, CreditCard } from 'lucide-react';
import { FormStep } from '../../types';
import authService from '../../services/auth';
import hostProfilesService from '../../services/hostProfiles';

const HostForm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [personalInfo, setPersonalInfo] = useState({
    civility: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    profilePhoto: '',
    password: '',
    confirmPassword: ''
  });

  const [presentationInfo, setPresentationInfo] = useState({
    description: '',
    languages: [] as string[],
    profession: '',
    interests: [] as string[],
    whyHost: ''
  });

  const [preparationInfo, setPreparationInfo] = useState({
    hostingFrequency: '',
    accommodationType: [] as string[],
    guestTypes: [] as string[],
    stayDuration: '',
    cancellationPolicy: ''
  });

  const [paymentInfo, setPaymentInfo] = useState({
    paymentMethod: '',
    bankAccount: '',
    bankName: '',
    bankCountry: '',
    mobileNumber: '',
    mobileName: '',
    mobileCity: '',
    mobileNetwork: ''
  });

  const [selectedPackage, setSelectedPackage] = useState('');
  const [commissionRate, setCommissionRate] = useState(0);

  useEffect(() => {
    const packageParam = searchParams.get('package');
    const commissionParam = searchParams.get('commission');

    if (packageParam) {
      // Mapper les anciens noms vers les nouveaux IDs
      const packageMapping: { [key: string]: string } = {
        'forfait-essentielle': 'essentielle',
        'forfait-optimisee': 'optimisee', 
        'forfait-premium': 'premium'
      };
      
      const mappedPackage = packageMapping[packageParam] || packageParam;
      setSelectedPackage(mappedPackage);
    }

    if (commissionParam) {
      if (commissionParam === 'FFT') {
        setCommissionRate(0); // 0 pour FFT (à négocier)
      } else {
        const rate = parseFloat(commissionParam);
        if (!isNaN(rate)) {
          setCommissionRate(rate);
        }
      }
    }
  }, [searchParams]);

  const steps: FormStep[] = [
    {
      id: 1,
      title: 'Informations personnelles',
      icon: User,
      description: 'Vos informations de base'
    },
    {
      id: 2,
      title: 'Présentation',
      icon: Users,
      description: 'Parlez-nous de vous'
    },
    {
      id: 3,
      title: 'Préparation',
      icon: Home,
      description: 'Vos préférences d\'hébergement'
    },
    {
      id: 4,
      title: 'Paiement',
      icon: CreditCard,
      description: 'Informations de paiement'
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Créer d'abord l'utilisateur
      const userData2 = await authService.signUp(
        personalInfo.email,
        personalInfo.password,
        {
          firstName: personalInfo.firstName,
          lastName: personalInfo.lastName,
          phone: personalInfo.phone,
          userType: 'owner'
        }
      );

      if (userData2?.user) {
        // Créer le profil hôte
        const hostProfileData = {
          user_id: userData2.user.id,
          selected_package: selectedPackage,
          commission_rate: commissionRate,
          description: presentationInfo.description,
          languages: presentationInfo.languages,
          profession: presentationInfo.profession,
          interests: presentationInfo.interests,
          why_host: presentationInfo.whyHost,
          hosting_frequency: preparationInfo.hostingFrequency,
          accommodation_type: preparationInfo.accommodationType,
          guest_types: preparationInfo.guestTypes,
          stay_duration: preparationInfo.stayDuration,
          payment_method: paymentInfo.paymentMethod,
          bank_account: paymentInfo.bankAccount,
          bank_name: paymentInfo.bankName,
          bank_country: paymentInfo.bankCountry,
          mobile_number: paymentInfo.mobileNumber,
          mobile_name: paymentInfo.mobileName,
          mobile_city: paymentInfo.mobileCity,
          mobile_network: paymentInfo.mobileNetwork,
          is_verified: false
        };

        await hostProfilesService.createHostProfile(hostProfileData);
        
        alert('Inscription hôte réussie ! Vérifiez votre email pour confirmer votre compte.');
        window.location.href = '/login';
      }
    } catch (error: any) {
      setError(error.message || 'Erreur lors de l\'inscription');
    } finally {
      setIsLoading(false);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <PersonalInfoStep
            data={personalInfo}
            onChange={setPersonalInfo}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <PresentationStep
            data={presentationInfo}
            onChange={setPresentationInfo}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 3:
        return (
          <PreparationStep
            data={preparationInfo}
            onChange={setPreparationInfo}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 4:
        return (
          <PaymentStep
            data={paymentInfo}
            onChange={setPaymentInfo}
            onSubmit={handleSubmit}
            onPrevious={handlePrevious}
            isLoading={isLoading}
            error={error}
            selectedPackage={selectedPackage}
            onPackageSelect={setSelectedPackage}
            commissionRate={commissionRate}
            onCommissionRateChange={setCommissionRate}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Devenir Hôte
          </h1>
          <p className="text-lg text-gray-600">
            Rejoignez notre communauté d'hôtes et commencez à accueillir des voyageurs
          </p>
        </div>

        <FormProgress steps={steps} currentStep={currentStep} />

        <div className="bg-white rounded-lg shadow-lg p-8 mt-8">
          {renderCurrentStep()}
        </div>
      </div>
    </div>
  );
};

export default HostForm;