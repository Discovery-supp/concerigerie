import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { DollarSign, Download, Calendar, TrendingUp, Users, Filter } from 'lucide-react';

interface FinancialReport {
  period: string;
  totalRevenue: number;
  commissions: number;
  netRevenue: number;
  reservationsCount: number;
  hostsCount: number;
}

interface FinancialReportsProps {
  userId: string;
}

const FinancialReports: React.FC<FinancialReportsProps> = ({ userId }) => {
  const [reports, setReports] = useState<FinancialReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'day' | 'month' | 'year' | 'all'>('month');

  useEffect(() => {
    loadFinancialData();
  }, [period]);

  const loadFinancialData = async () => {
    try {
      setLoading(true);

      // Charger toutes les réservations complétées
      const { data: reservations } = await supabase
        .from('reservations')
        .select(`
          *,
          property:properties!inner(owner_id, price_per_night)
        `)
        .eq('status', 'completed');

      // Charger les hôtes avec leurs forfaits
      const { data: hosts } = await supabase
        .from('host_profiles')
        .select('user_id, selected_package, commission_rate');

      // Calculer les rapports financiers
      const reportsData = calculateFinancialReports(reservations || [], hosts || []);
      setReports(reportsData);
    } catch (error) {
      console.error('Erreur chargement données financières:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateFinancialReports = (reservations: any[], hosts: any[]): FinancialReport[] => {
    // Grouper par période
    const grouped = reservations.reduce((acc: any, res: any) => {
      const date = new Date(res.created_at);
      let key: string;

      switch (period) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'year':
          key = String(date.getFullYear());
          break;
        default:
          key = 'all';
      }

      if (!acc[key]) {
        acc[key] = {
          period: formatPeriod(key, period),
          totalRevenue: 0,
          commissions: 0,
          reservationsCount: 0,
          hosts: new Set()
        };
      }

      const revenue = Number(res.total_amount || 0);
      const hostProfile = hosts.find(h => h.user_id === res.property.owner_id);
      const commissionRate = hostProfile?.commission_rate || 0.15; // 15% par défaut
      const commission = revenue * commissionRate;

      acc[key].totalRevenue += revenue;
      acc[key].commissions += commission;
      acc[key].reservationsCount += 1;
      acc[key].hosts.add(res.property.owner_id);

      return acc;
    }, {});

    // Convertir en tableau
    return Object.entries(grouped).map(([key, data]: [string, any]) => ({
      period: data.period,
      totalRevenue: data.totalRevenue,
      commissions: data.commissions,
      netRevenue: data.totalRevenue - data.commissions,
      reservationsCount: data.reservationsCount,
      hostsCount: data.hosts.size
    })).sort((a, b) => b.period.localeCompare(a.period));
  };

  const formatPeriod = (key: string, periodType: string): string => {
    if (periodType === 'day') {
      return new Date(key).toLocaleDateString('fr-FR');
    } else if (periodType === 'month') {
      const [year, month] = key.split('-');
      return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    } else if (periodType === 'year') {
      return key;
    }
    return 'Toutes périodes';
  };

  const handleExportHosts = async () => {
    try {
      // Charger tous les hôtes avec leurs informations de paiement
      const { data: hosts } = await supabase
        .from('host_profiles')
        .select(`
          *,
          user:user_profiles!host_profiles_user_id_fkey(email, first_name, last_name, phone)
        `);

      const csv = [
        ['Email', 'Nom', 'Prénom', 'Téléphone', 'Forfait', 'Taux commission', 'Méthode paiement', 'Compte bancaire', 'Mobile Money'].join(','),
        ...(hosts || []).map((h: any) => [
          h.user?.email || '',
          h.user?.last_name || '',
          h.user?.first_name || '',
          h.user?.phone || '',
          h.selected_package || '',
          `${(h.commission_rate * 100).toFixed(0)}%`,
          h.payment_method || '',
          h.bank_account || '',
          h.mobile_number || ''
        ].join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `base-hotes-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch (error) {
      console.error('Erreur export hôtes:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Rapports Financiers</h3>
          <div className="flex space-x-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="day">Par jour</option>
              <option value="month">Par mois</option>
              <option value="year">Par année</option>
              <option value="all">Toutes périodes</option>
            </select>
            <button
              onClick={handleExportHosts}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Exporter base hôtes</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <DollarSign className="w-8 h-8 text-blue-600 mb-2" />
            <p className="text-sm text-gray-600 mb-1">Revenus totaux</p>
            <p className="text-2xl font-bold text-gray-900">
              {reports.reduce((sum, r) => sum + r.totalRevenue, 0).toFixed(2)} €
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <TrendingUp className="w-8 h-8 text-green-600 mb-2" />
            <p className="text-sm text-gray-600 mb-1">Revenus nets</p>
            <p className="text-2xl font-bold text-gray-900">
              {reports.reduce((sum, r) => sum + r.netRevenue, 0).toFixed(2)} €
            </p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <Users className="w-8 h-8 text-red-600 mb-2" />
            <p className="text-sm text-gray-600 mb-1">Commissions</p>
            <p className="text-2xl font-bold text-gray-900">
              {reports.reduce((sum, r) => sum + r.commissions, 0).toFixed(2)} €
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Période</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenus totaux</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commissions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenus nets</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Réservations</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hôtes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.map((report, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{report.period}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.totalRevenue.toFixed(2)} €</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{report.commissions.toFixed(2)} €</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">{report.netRevenue.toFixed(2)} €</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.reservationsCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.hostsCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinancialReports;

