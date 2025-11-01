import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { hostPaymentsService, HostPayment, HostPaymentDetail } from '../../services/hostPayments';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  CreditCard, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Download,
  Eye
} from 'lucide-react';

interface HostEarningsProps {
  hostId: string;
}

const HostEarnings: React.FC<HostEarningsProps> = ({ hostId }) => {
  const [payments, setPayments] = useState<HostPayment[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<HostPayment | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<HostPaymentDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalReservations: 0,
    totalCommission: 0,
    averageEarningsPerReservation: 0,
    monthlyBreakdown: [] as Array<{
      month: number;
      year: number;
      earnings: number;
      reservations: number;
    }>
  });

  useEffect(() => {
    loadHostData();
  }, [hostId]);

  const loadHostData = async () => {
    try {
      setLoading(true);
      const [paymentsData, statsData] = await Promise.all([
        hostPaymentsService.getHostPayments(hostId),
        hostPaymentsService.getHostStats(hostId)
      ]);
      
      setPayments(paymentsData);
      setStats(statsData);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentDetails = async (payment: HostPayment) => {
    try {
      const details = await hostPaymentsService.getHostPaymentDetails(payment.id);
      setPaymentDetails(details);
      setSelectedPayment(payment);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des détails');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getMonthName = (month: number) => {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[month - 1];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques générales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Gains Totaux</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.totalEarnings)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Réservations</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalReservations}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Commission App</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.totalCommission)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Moyenne/Réservation</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.averageEarningsPerReservation)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Graphique des gains mensuels */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Gains Mensuels</h3>
        <div className="space-y-3">
          {stats.monthlyBreakdown.map((month, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">
                {getMonthName(month.month)} {month.year}
              </span>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">{month.reservations} réservations</span>
                <span className="text-sm font-semibold text-green-600">
                  {formatCurrency(month.earnings)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Liste des paiements */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Historique des Paiements</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Période
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Réservations
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenus Bruts
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vos Gains
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {getMonthName(payment.month)} {payment.year}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.total_reservations}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(payment.total_revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(payment.commission_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                    {formatCurrency(payment.host_earnings)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.payment_status)}`}>
                      {getStatusIcon(payment.payment_status)}
                      <span className="ml-1 capitalize">{payment.payment_status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => loadPaymentDetails(payment)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {payment.payment_status === 'paid' && (
                      <button className="text-green-600 hover:text-green-900">
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal des détails de paiement */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Détails du Paiement - {getMonthName(selectedPayment.month)} {selectedPayment.year}
                </h3>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Fermer</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Revenus Bruts</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {formatCurrency(selectedPayment.total_revenue)}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Commission Application</p>
                    <p className="text-xl font-semibold text-red-600">
                      {formatCurrency(selectedPayment.commission_amount)}
                    </p>
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Vos Gains</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(selectedPayment.host_earnings)}
                  </p>
                </div>

                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Réservations Détail</h4>
                  <div className="space-y-2">
                    {paymentDetails.map((detail) => (
                      <div key={detail.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {detail.reservation?.property?.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {detail.reservation?.check_in} - {detail.reservation?.check_out}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-green-600">
                            {formatCurrency(detail.host_amount)}
                          </p>
                          <p className="text-xs text-gray-500">
                            Commission: {formatCurrency(detail.commission_amount)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HostEarnings;

