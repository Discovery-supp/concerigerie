import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import authService from '../services/auth';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email) {
      setError('Veuillez saisir votre adresse email.');
      return;
    }

    setIsSubmitting(true);

    try {
      await authService.requestPasswordReset(email);
      setSuccess(
        'Si un compte existe avec cet email, un lien de réinitialisation de mot de passe vous a été envoyé.'
      );
    } catch (err: any) {
      console.error('Erreur envoi email de réinitialisation:', err);
      setError(
        err.message ||
          'Une erreur est survenue lors de la demande de réinitialisation. Veuillez réessayer.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link
            to="/login"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour à la connexion
          </Link>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
            Mot de passe oublié
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Indiquez l&rsquo;adresse email associée à votre compte. Vous recevrez un lien sécurisé
            pour réinitialiser votre mot de passe.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center">
            <CheckCircle2 className="w-5 h-5 mr-2" />
            <span className="text-sm">{success}</span>
          </div>
        )}

        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Adresse email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="vous@example.com"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-all ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-primary hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Envoi en cours...
                  </div>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    <span>Envoyer le lien de réinitialisation</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-xs text-gray-500">
            Pour des raisons de sécurité, nous n&rsquo;indiquons pas si une adresse email est
            enregistrée ou non dans notre système.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;



