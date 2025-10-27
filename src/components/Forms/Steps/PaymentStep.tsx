import React from 'react';

interface PaymentStepProps {
  data: {
    paymentMethod: string;
    bankAccount: string;
    bankName: string;
    bankCountry: string;
    mobileNumber: string;
    mobileName: string;
    mobileCity: string;
    mobileNetwork: string;
  };
  onChange: (data: any) => void;
  onSubmit: () => void;
  onPrevious: () => void;
  isLoading: boolean;
  error: string;
  selectedPackage: string;
  onPackageSelect: (packageId: string) => void;
  commissionRate: number;
  onCommissionRateChange: (rate: number) => void;
}

const PaymentStep: React.FC<PaymentStepProps> = ({
  data,
  onChange,
  onSubmit,
  onPrevious,
  isLoading,
  error,
  selectedPackage,
  onPackageSelect,
  commissionRate,
  onCommissionRateChange
}) => {
  const paymentMethods = [
    { value: 'bank', label: 'Virement bancaire' },
    { value: 'mobile_money', label: 'Mobile Money' },
    { value: 'cash', label: 'Espèces' }
  ];

  const mobileNetworks = [
    'Orange Money',
    'M-Pesa',
    'Airtel Money',
    'Tigo Cash'
  ];

  const packages = [
    { id: 'essentielle', name: 'Forfait Essentielle', commission: 15 },
    { id: 'optimisee', name: 'Forfait Optimisée', commission: 25 },
    { id: 'premium', name: 'Forfait Prémium', commission: 'FFT' }
  ];

  const handleInputChange = (field: string, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const handlePackageChange = (packageId: string) => {
    const selectedPkg = packages.find(pkg => pkg.id === packageId);
    if (selectedPkg) {
      onPackageSelect(packageId);
      // Pour le forfait FFT, on ne peut pas définir un taux de commission fixe
      if (selectedPkg.commission === 'FFT') {
        onCommissionRateChange(0); // 0 pour FFT (à négocier)
      } else {
        onCommissionRateChange(selectedPkg.commission as number);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (data.paymentMethod && selectedPackage) {
      onSubmit();
    } else {
      alert('Veuillez remplir tous les champs obligatoires');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-primary mb-6">Informations de paiement</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-secondary mb-3">Choisir un forfait *</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {packages.map(pkg => (
              <label key={pkg.id} className="flex items-center p-4 border border-light-gray rounded-lg cursor-pointer hover:border-primary transition-colors">
                <input
                  type="radio"
                  name="package"
                  value={pkg.id}
                  checked={selectedPackage === pkg.id}
                  onChange={(e) => handlePackageChange(e.target.value)}
                  className="mr-3 text-primary"
                />
                <div>
                  <span className="font-medium text-secondary">{pkg.name}</span>
                  <p className="text-sm text-gray-500">
                    Commission: {pkg.commission === 'FFT' ? 'FFT (à négocier)' : `${pkg.commission}%`}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary mb-3">Mode de paiement préféré *</label>
          <div className="space-y-2">
            {paymentMethods.map(method => (
              <label key={method.value} className="flex items-center p-3 border border-light-gray rounded-lg cursor-pointer hover:border-primary transition-colors">
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method.value}
                  checked={data.paymentMethod === method.value}
                  onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                  className="mr-3 text-primary"
                />
                <span className="text-secondary">{method.label}</span>
              </label>
            ))}
          </div>
        </div>

        {data.paymentMethod === 'bank' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">Numéro de compte bancaire</label>
              <input
                type="text"
                value={data.bankAccount}
                onChange={(e) => handleInputChange('bankAccount', e.target.value)}
                className="w-full px-4 py-3 border border-light-gray rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">Nom de la banque</label>
              <input
                type="text"
                value={data.bankName}
                onChange={(e) => handleInputChange('bankName', e.target.value)}
                className="w-full px-4 py-3 border border-light-gray rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">Pays de la banque</label>
              <input
                type="text"
                value={data.bankCountry}
                onChange={(e) => handleInputChange('bankCountry', e.target.value)}
                className="w-full px-4 py-3 border border-light-gray rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        )}

        {data.paymentMethod === 'mobile_money' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">Numéro de téléphone</label>
              <input
                type="tel"
                value={data.mobileNumber}
                onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                className="w-full px-4 py-3 border border-light-gray rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">Nom du titulaire</label>
              <input
                type="text"
                value={data.mobileName}
                onChange={(e) => handleInputChange('mobileName', e.target.value)}
                className="w-full px-4 py-3 border border-light-gray rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">Ville</label>
              <input
                type="text"
                value={data.mobileCity}
                onChange={(e) => handleInputChange('mobileCity', e.target.value)}
                className="w-full px-4 py-3 border border-light-gray rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">Réseau mobile</label>
              <select
                value={data.mobileNetwork}
                onChange={(e) => handleInputChange('mobileNetwork', e.target.value)}
                className="w-full px-4 py-3 border border-light-gray rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Sélectionnez un réseau</option>
                {mobileNetworks.map(network => (
                  <option key={network} value={network}>{network}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-6">
          <button
            type="button"
            onClick={onPrevious}
            className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-all"
          >
            Retour
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className={`px-8 py-3 font-semibold rounded-lg transition-all ${
              isLoading 
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-primary text-white hover:bg-primary-light'
            }`}
          >
            {isLoading ? 'Inscription...' : 'Finaliser l\'inscription'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PaymentStep;