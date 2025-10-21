import React from 'react';

interface PresentationStepProps {
  data: {
    description: string;
    languages: string[];
    profession: string;
    interests: string[];
    whyHost: string;
  };
  onChange: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const PresentationStep: React.FC<PresentationStepProps> = ({ data, onChange, onNext, onPrevious }) => {
  const availableLanguages = ['Français', 'Anglais', 'Lingala', 'Kikongo', 'Tshiluba', 'Swahili'];
  const availableInterests = ['Voyage', 'Culture', 'Gastronomie', 'Sport', 'Art', 'Musique', 'Nature', 'Histoire'];

  const handleInputChange = (field: string, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const handleLanguageToggle = (language: string) => {
    const updatedLanguages = data.languages.includes(language)
      ? data.languages.filter(l => l !== language)
      : [...data.languages, language];
    handleInputChange('languages', updatedLanguages);
  };

  const handleInterestToggle = (interest: string) => {
    const updatedInterests = data.interests.includes(interest)
      ? data.interests.filter(i => i !== interest)
      : [...data.interests, interest];
    handleInputChange('interests', updatedInterests);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (data.description && data.languages.length > 0 && data.profession) {
      onNext();
    } else {
      alert('Veuillez remplir tous les champs obligatoires');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-primary mb-6">Présentez-vous</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-secondary mb-2">Description personnelle *</label>
          <textarea
            value={data.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={4}
            placeholder="Parlez-nous de vous, de vos passions, de votre expérience..."
            className="w-full px-4 py-3 border border-light-gray rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary mb-2">Langues parlées *</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {availableLanguages.map(language => (
              <label key={language} className="flex items-center">
                <input
                  type="checkbox"
                  checked={data.languages.includes(language)}
                  onChange={() => handleLanguageToggle(language)}
                  className="mr-2 text-primary rounded"
                />
                <span className="text-sm text-secondary">{language}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary mb-2">Profession *</label>
          <input
            type="text"
            value={data.profession}
            onChange={(e) => handleInputChange('profession', e.target.value)}
            placeholder="Votre profession actuelle"
            className="w-full px-4 py-3 border border-light-gray rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary mb-2">Centres d'intérêt</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {availableInterests.map(interest => (
              <label key={interest} className="flex items-center">
                <input
                  type="checkbox"
                  checked={data.interests.includes(interest)}
                  onChange={() => handleInterestToggle(interest)}
                  className="mr-2 text-primary rounded"
                />
                <span className="text-sm text-secondary">{interest}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary mb-2">Pourquoi souhaitez-vous devenir hôte ?</label>
          <textarea
            value={data.whyHost}
            onChange={(e) => handleInputChange('whyHost', e.target.value)}
            rows={3}
            placeholder="Partagez vos motivations..."
            className="w-full px-4 py-3 border border-light-gray rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          />
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
            Suivant
          </button>
        </div>
      </form>
    </div>
  );
};

export default PresentationStep;