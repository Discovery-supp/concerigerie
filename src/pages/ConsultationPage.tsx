import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import consultationService from '../services/consultation';

const ConsultationPage: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      // Préparer les données pour l'enregistrement
      const messageData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        subject: formData.subject,
        message: formData.message
      };

      // Enregistrer dans la base de données
      await consultationService.saveConsultationMessage(messageData);

      // Succès
      setSubmitSuccess(true);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        subject: '',
        message: ''
      });

    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      setSubmitError(
        error instanceof Error 
          ? error.message 
          : 'Une erreur est survenue lors de l\'envoi de votre message. Veuillez réessayer.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold font-heading text-primary mb-4">
            Consultation Gratuite
          </h1>
          <p className="text-xl text-secondary">
            Contactez-nous pour discuter de vos besoins et obtenir une consultation sans engagement
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            <div className="bg-primary p-8 md:p-12 text-white">
              <h2 className="text-2xl font-bold mb-6">Nos Coordonnées</h2>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <Mail className="w-6 h-6 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Email de l'administrateur</h3>
                    <a
                      href="mailto:contact@nzooimmo.com"
                      className="text-gray-100 hover:underline"
                    >
                      contact@nzooimmo.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Phone className="w-6 h-6 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Appeler l'administrateur</h3>
                    <a
                      href="tel:+243000000000"
                      className="inline-flex items-center px-3 py-2 mt-1 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium text-white transition-colors"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      +243 00 000 0000
                    </a>
                    <p className="text-xs text-gray-200 mt-1">
                      Cliquez sur le bouton pour lancer l'appel depuis votre téléphone.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <MapPin className="w-6 h-6 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Adresse</h3>
                    <p className="text-gray-100">Kinshasa, RD Congo</p>
                  </div>
                </div>
              </div>

              <div className="mt-12 p-6 bg-white/10 backdrop-blur-sm rounded-xl">
                <h3 className="font-semibold mb-2">Heures d'ouverture</h3>
                <p className="text-sm text-gray-100">Lundi - Vendredi : 8h - 18h</p>
                <p className="text-sm text-gray-100">Samedi : 9h - 15h</p>
                <p className="text-sm text-gray-100">Dimanche : Fermé</p>
              </div>
            </div>

            <div className="p-8 md:p-12">
              <h2 className="text-2xl font-bold text-primary mb-6">Envoyez-nous un message</h2>

              {submitSuccess && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
                  <div className="flex items-center">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold">Message envoyé avec succès !</h4>
                      <p className="text-sm">Merci pour votre message. Nous vous contacterons bientôt.</p>
                    </div>
                  </div>
                </div>
              )}

              {submitError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                  <div className="flex items-center">
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold">Erreur lors de l'envoi</h4>
                      <p className="text-sm">{submitError}</p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-light-gray rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">
                      Nom *
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-light-gray rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-light-gray rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    Numéro de téléphone *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-light-gray rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    Adresse
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full px-4 py-3 border border-light-gray rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    Sujet *
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-light-gray rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    Message *
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    required
                    rows={5}
                    className="w-full px-4 py-3 border border-light-gray rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <span>Envoi en cours...</span>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Envoyer le message</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultationPage;
