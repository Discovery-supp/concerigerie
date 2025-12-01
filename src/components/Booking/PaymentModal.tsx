import React, { useState } from 'react';
import { X, CreditCard, Smartphone, Wallet, Shield, CheckCircle } from 'lucide-react';

interface PaymentModalProps {
  amount: number;
  property: any;
  reservationData: {
    checkIn: string;
    checkOut: string;
    guests: number;
    nights: number;
  };
  onPaymentSuccess: (paymentData: {
    payment_method: string;
    payment_status: string;
    transaction_id?: string;
  }) => void;
  onClose: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  amount,
  property,
  reservationData,
  onPaymentSuccess,
  onClose
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mobile_money' | 'cash'>('card');
  const [loading, setLoading] = useState(false);
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  const [mobileMoneyData, setMobileMoneyData] = useState({
    provider: 'orange' as 'orange' | 'airtel' | 'mpesa',
    phone: ''
  });

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Simuler le traitement du paiement
      // Dans une vraie application, vous utiliseriez Stripe, PayPal, ou une API de Mobile Money
      
      let paymentStatus = 'paid';
      let transactionId = '';

      if (paymentMethod === 'card') {
        // Intégrer avec Stripe ou autre processeur de paiement
        transactionId = `CARD_${Date.now()}`;
        // Simuler un délai de traitement
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else if (paymentMethod === 'mobile_money') {
        // Intégrer avec une API Mobile Money
        transactionId = `${mobileMoneyData.provider.toUpperCase()}_${Date.now()}`;
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        // Cash - marquer comme en attente
        paymentStatus = 'pending';
        transactionId = `CASH_${Date.now()}`;
      }

      onPaymentSuccess({
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        transaction_id: transactionId
      });
    } catch (error: any) {
      alert('Erreur lors du paiement: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-900">Paiement sécurisé</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Récapitulatif */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold mb-3">Récapitulatif de la réservation</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Propriété</span>
                <span className="font-medium">{property.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Dates</span>
                <span className="font-medium">
                  {new Date(reservationData.checkIn).toLocaleDateString('fr-FR')} - {new Date(reservationData.checkOut).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Durée</span>
                <span className="font-medium">{reservationData.nights} nuit(s)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Voyageurs</span>
                <span className="font-medium">{reservationData.guests}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Méthodes de paiement */}
          <div>
            <h4 className="font-semibold mb-3">Méthode de paiement</h4>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => setPaymentMethod('card')}
                className={`p-4 border-2 rounded-lg text-center transition-colors ${
                  paymentMethod === 'card'
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CreditCard className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                <p className="text-sm font-medium">Carte bancaire</p>
                <p className="text-xs text-gray-500 mt-1">Visa/Mastercard</p>
              </button>

              <button
                onClick={() => setPaymentMethod('mobile_money')}
                className={`p-4 border-2 rounded-lg text-center transition-colors ${
                  paymentMethod === 'mobile_money'
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Smartphone className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                <p className="text-sm font-medium">Mobile Money</p>
                <p className="text-xs text-gray-500 mt-1">Orange/Airtel</p>
              </button>

              <button
                onClick={() => setPaymentMethod('cash')}
                className={`p-4 border-2 rounded-lg text-center transition-colors ${
                  paymentMethod === 'cash'
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Wallet className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                <p className="text-sm font-medium">En espèces</p>
                <p className="text-xs text-gray-500 mt-1">Sur place</p>
              </button>
            </div>
          </div>

          {/* Formulaire selon la méthode */}
          {paymentMethod === 'card' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom sur la carte
                </label>
                <input
                  type="text"
                  value={cardData.name}
                  onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                  placeholder="Jean Dupont"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de carte
                </label>
                <input
                  type="text"
                  value={cardData.number}
                  onChange={(e) => setCardData({ ...cardData, number: e.target.value.replace(/\s/g, '') })}
                  placeholder="1234 5678 9012 3456"
                  maxLength={16}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date d'expiration
                  </label>
                  <input
                    type="text"
                    value={cardData.expiry}
                    onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                    placeholder="MM/AA"
                    maxLength={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CVV
                  </label>
                  <input
                    type="text"
                    value={cardData.cvv}
                    onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                    placeholder="123"
                    maxLength={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {paymentMethod === 'mobile_money' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opérateur
                </label>
                <select
                  value={mobileMoneyData.provider}
                  onChange={(e) => setMobileMoneyData({ ...mobileMoneyData, provider: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                >
                  <option value="orange">Orange Money</option>
                  <option value="airtel">Airtel Money</option>
                  <option value="mpesa">M-Pesa</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de téléphone
                </label>
                <input
                  type="tel"
                  value={mobileMoneyData.phone}
                  onChange={(e) => setMobileMoneyData({ ...mobileMoneyData, phone: e.target.value })}
                  placeholder="+243 900 000 000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          )}

          {paymentMethod === 'cash' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                Le paiement en espèces sera effectué sur place lors de votre arrivée.
                Votre réservation sera confirmée après réception du paiement.
              </p>
            </div>
          )}

          {/* Sécurité */}
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Shield className="w-5 h-5 text-green-600" />
            <span>Paiement sécurisé et crypté</span>
          </div>

          {/* Bouton de paiement */}
          <button
            onClick={handlePayment}
            disabled={loading || (paymentMethod === 'card' && (!cardData.name || !cardData.number || !cardData.expiry || !cardData.cvv)) || (paymentMethod === 'mobile_money' && !mobileMoneyData.phone)}
            className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-semibold"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Traitement du paiement...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Payer ${amount.toFixed(2)}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;

