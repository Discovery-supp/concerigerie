import React from 'react';

interface PreparationStepProps {
  data: {
    hostingFrequency: string;
    accommodationType: string[];
    guestTypes: string[];
    stayDuration: string;
    cancellationPolicy: string;
  };
  onChange: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const PreparationStep: React.FC<PreparationStepProps> = ({ data, onChange, onNext, onPrevious }) => {
  const hostingFrequencies = [
    { value: 'occasional', label: 'Occasionnellement (quelques fois par an)' },
    { value: 'regular', label: 'Régulièrement (plusieurs fois par mois)' },
    { value: 'frequent', label: 'Fréquemment (plusieurs fois par semaine)' },
    { value: 'fulltime', label: 'À temps plein (activité principale)' }
  ];

  const accommodationTypes = [
    { value: 'entire_place', label: 'Logement entier' },
    { value: 'private_room', label: 'Chambre privée' },
    { value: 'shared_room', label: 'Chambre partagée' },
    { value: 'multiple_rooms', label: 'Plusieurs chambres' }
  ];

  const guestTypeOptions = [
    'Voyageurs d\'affaires',
    'Familles avec enfants',
    'Couples',
    'Groupes d\'amis',
    'Voyageurs solo',
    'Étudiants'
  ];

  const stayDurations = [
    { value: 'short', label: 'Courts séjours (1-3 nuits)' },
    { value: 'medium', label: 'Séjours moyens (4-7 nuits)' },
    { value: 'long', label: 'Longs séjours (1 semaine et plus)' },
    { value: 'flexible', label: 'Flexible selon les demandes' }
  ];

  const cancellationPolicies = [
    { value: 'flexible', label: 'Annulation gratuite', description: 'Remboursement intégral jusqu\'à 24h avant l\'arrivée' },
    { value: 'moderate', label: 'Remboursement 50%', description: '50% de remboursement si annulation avant 24h' },
    { value: 'strict', label: 'Remboursement 20%', description: '20% de remboursement si annulation dans les 48h' },
    { value: 'non_refundable', label: 'Non remboursable', description: 'Aucun remboursement en cas d\'annulation' }
  ];

  const handleInputChange = (field: string, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const handleAccommodationTypeToggle = (type: string) => {
    const updatedTypes = data.accommodationType.includes(type)
      ? data.accommodationType.filter(t => t !== type)
      : [...data.accommodationType, type];
    handleInputChange('accommodationType', updatedTypes);
  };

  const handleGuestTypeToggle = (guestType: string) => {
    const updatedTypes = data.guestTypes.includes(guestType)
      ? data.guestTypes.filter(t => t !== guestType)
      : [...data.guestTypes, guestType];
    handleInputChange('guestTypes', updatedTypes);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (data.hostingFrequency && data.accommodationType.length > 0 && data.stayDuration && data.cancellationPolicy) {
      onNext();
    } else {
      alert('Veuillez remplir tous les champs obligatoires');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-primary mb-6">Préparation à l'hébergement</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-secondary mb-3">À quelle fréquence souhaitez-vous héberger ? *</label>
          <div className="space-y-2">
            {hostingFrequencies.map(freq => (
              <label key={freq.value} className="flex items-center p-3 border border-light-gray rounded-lg cursor-pointer hover:border-primary transition-colors">
                <input
                  type="radio"
                  name="hostingFrequency"
                  value={freq.value}
                  checked={data.hostingFrequency === freq.value}
                  onChange={(e) => handleInputChange('hostingFrequency', e.target.value)}
                  className="mr-3 text-primary"
                />
                <span className="text-secondary">{freq.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary mb-3">Type d'hébergement proposé (sélection multiple) *</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {accommodationTypes.map(type => (
              <label key={type.value} className="flex items-center p-3 border border-light-gray rounded-lg cursor-pointer hover:border-primary transition-colors">
                <input
                  type="checkbox"
                  checked={data.accommodationType.includes(type.value)}
                  onChange={() => handleAccommodationTypeToggle(type.value)}
                  className="mr-3 text-primary rounded"
                />
                <span className="text-secondary">{type.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary mb-3">Types de voyageurs que vous souhaitez accueillir</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {guestTypeOptions.map(guestType => (
              <label key={guestType} className="flex items-center p-3 border border-light-gray rounded-lg cursor-pointer hover:border-primary transition-colors">
                <input
                  type="checkbox"
                  checked={data.guestTypes.includes(guestType)}
                  onChange={() => handleGuestTypeToggle(guestType)}
                  className="mr-3 text-primary rounded"
                />
                <span className="text-sm text-secondary">{guestType}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary mb-3">Durée de séjour préférée *</label>
          <div className="space-y-2">
            {stayDurations.map(duration => (
              <label key={duration.value} className="flex items-center p-3 border border-light-gray rounded-lg cursor-pointer hover:border-primary transition-colors">
                <input
                  type="radio"
                  name="stayDuration"
                  value={duration.value}
                  checked={data.stayDuration === duration.value}
                  onChange={(e) => handleInputChange('stayDuration', e.target.value)}
                  className="mr-3 text-primary"
                />
                <span className="text-secondary">{duration.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary mb-3">Politique d'annulation *</label>
          <div className="space-y-2">
            {cancellationPolicies.map(policy => (
              <label key={policy.value} className="flex items-start p-4 border border-light-gray rounded-lg cursor-pointer hover:border-primary transition-colors">
                <input
                  type="radio"
                  name="cancellationPolicy"
                  value={policy.value}
                  checked={data.cancellationPolicy === policy.value}
                  onChange={(e) => handleInputChange('cancellationPolicy', e.target.value)}
                  className="mr-3 mt-1 text-primary"
                />
                <div>
                  <span className="text-secondary font-semibold block">{policy.label}</span>
                  <span className="text-sm text-gray-500">{policy.description}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

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
            className="px-8 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-light transition-all"
          >
            Terminer
          </button>
        </div>
      </form>
    </div>
  );
};

export default PreparationStep;