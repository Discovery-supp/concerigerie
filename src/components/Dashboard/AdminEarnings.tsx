import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { hostPaymentsService, HostPayment, AppEarnings } from '../../services/hostPayments';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  CreditCard, 
  Calendar,
  Download,
  Settings,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

const AdminEarnings: React.FC = () => {
  const [appStats, setAppStats] = useState({
    totalRevenue: 0,
    totalCommission: 0,
    totalHostPayments: 0,
    netEarnings: 0,
    totalReservations: 0,
    monthlyBreakdown: [] as Array<{
      month: number;
      year: number;
      revenue: number;
      commission: number;
      hostPayments: number;
      netEarnings: number;
      reservations: number;
    }>
  });
  const [hostPayments, setHostPayments] = useState<HostPayment[]>([]);
  const [commissionSettings, setCommissionSettings] = useState({ commission_percentage: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState({
    startDate: '',
    endDate: ''
  });
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [newCommissionRate, setNewCommissionRate] = useState(10);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [statsData, paymentsData, settingsData] = await Promise.all([
        hostPaymentsService.getAppStats(),
        hostPaymentsService.getAllHostPayments(),
        hostPaymentsService.getCommissionSettings()
      ]);
      
      setAppStats(statsData);
      setHostPayments(paymentsData);
      setCommissionSettings(settingsData);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const calculatePaymentsForMonth = async (month: number, year: number) => {
    try {
      await hostPaymentsService.calculateHostPayments(month, year);
      await loadAdminData();
    } catch (err: any) {
      setError(err.message || 'Erreur lors du calcul des paiements');
    }
  };

  const markPaymentAsPaid = async (paymentId: string, paymentMethod: string, paymentReference: string) => {
    try {
      await hostPaymentsService.markPaymentAsPaid(paymentId, paymentMethod, paymentReference);
      await loadAdminData();
    } catch (err: any) {
      setError(err.message || 'Erreur lors du marquage du paiement');
    }
  };

  const updateCommissionRate = async () => {
    try {
      await hostPaymentsService.updateCommissionSettings(newCommissionRate);
      setCommissionSettings({ commission_percentage: newCommissionRate });
      setShowCommissionModal(false);
      await loadAdminData();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour du taux de commission');
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
      {/* En-tête avec actions */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Paiements</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCommissionModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Settings className="w-4 h-4 mr-2" />
            Commission ({commissionSettings.commission_percentage}%)
          </button>
          <button
            onClick={() => calculatePaymentsForMonth(new Date().getMonth() + 1, new Date().getFullYear())}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Calculer Ce Mois
          </button>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Revenus Totaux</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(appStats.totalRevenue)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Bénéfices Net</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(appStats.netEarnings)}
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
              <p className="text-sm font-medium text-gray-600">Commission Totale</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(appStats.totalCommission)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Paiements Hôtes</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(appStats.totalHostPayments)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Graphique des revenus mensuels */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenus Mensuels</h3>
        <div className="space-y-3">
          {appStats.monthlyBreakdown.map((month, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600">
                {getMonthName(month.month)} {month.year}
              </span>
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Revenus</p>
                  <p className="text-sm font-semibold text-blue-600">
                    {formatCurrency(month.revenue)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Commission</p>
                  <p className="text-sm font-semibold text-purple-600">
                    {formatCurrency(month.commission)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Paiements Hôtes</p>
                  <p className="text-sm font-semibold text-orange-600">
                    {formatCurrency(month.hostPayments)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Bénéfices Net</p>
                  <p className="text-sm font-semibold text-green-600">
                    {formatCurrency(month.netEarnings)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Réservations</p>
                  <p className="text-sm font-semibold text-gray-600">
                    {month.reservations}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Liste des paiements aux hôtes */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Paiements aux Hôtes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hôte
                </th>
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
                  Paiement Hôte
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
              {hostPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {payment.host?.first_name} {payment.host?.last_name}
                    </div>
                    <div className="text-sm text-gray-500">{payment.host?.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                    <button className="text-blue-600 hover:text-blue-900 mr-3">
                      <Eye className="w-4 h-4" />
                    </button>
                    {payment.payment_status === 'pending' && (
                      <button
                        onClick={() => markPaymentAsPaid(payment.id, 'bank_transfer', `PAY-${Date.now()}`)}
                        className="text-green-600 hover:text-green-900"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de configuration de commission */}
      {showCommissionModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Configuration du Taux de Commission
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nouveau taux de commission (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="0.1"
                    value={newCommissionRate}
                    onChange={(e) => setNewCommissionRate(Number(e.target.value))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Cette modification s'appliquera aux nouvelles réservations uniquement.
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCommissionModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  onClick={updateCommissionRate}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Mettre à jour
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEarnings;

