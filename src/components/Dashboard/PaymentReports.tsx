import React, { useState, useEffect } from 'react';
import { DollarSign, Calendar, Download, Filter, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { attachReservationDetails } from '../../services/reservations';

interface PaymentReport {
  id: string;
  period: string;
  totalRevenue: number;
  serviceFees: number;
  netPayment: number;
  reservationsCount: number;
  status: 'pending' | 'paid' | 'processing';
  paymentDate?: string;
}

interface PaymentReportsProps {
  userId: string;
  userType: 'owner' | 'admin';
}

const PaymentReports: React.FC<PaymentReportsProps> = ({ userId, userType }) => {
  const [reports, setReports] = useState<PaymentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'month' | 'year'>('all');

  useEffect(() => {
    loadReports();
  }, [userId, filter, periodFilter]);

  const loadReports = async () => {
    try {
      setLoading(true);
      
      if (userType === 'owner') {
        // Charger les rapports de paiement pour l'hôte
        // Calculer les revenus par période
        const { data: ownerProperties } = await supabase
          .from('properties')
          .select('id')
          .eq('owner_id', userId);

        const propertyIds = ownerProperties?.map(p => p.id) || [];
        if (propertyIds.length === 0) {
          setReports([]);
          return;
        }

        const { data: reservationsRaw } = await supabase
          .from('reservations')
          .select('*')
          .in('property_id', propertyIds)
          .eq('status', 'completed');

        const reservationsWithDetails = await attachReservationDetails(reservationsRaw || [], {
          includeProperty: true
        });

        // Calculer les revenus par mois
        const monthlyReports = await calculateMonthlyReports(reservationsWithDetails || []);
        setReports(monthlyReports);
      } else {
        // Admin: voir tous les paiements
        // À implémenter
      }
    } catch (error) {
      console.error('Erreur chargement rapports:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyReports = async (reservations: any[]): Promise<PaymentReport[]> => {
    // Charger le profil hôte pour obtenir le forfait et le taux de commission
    const { data: hostProfile } = await supabase
      .from('host_profiles')
      .select('selected_package, commission_rate')
      .eq('user_id', userId)
      .single();

    const commissionRate = hostProfile?.commission_rate || 0.15; // Par défaut 15%

    // Grouper par mois et calculer les revenus
    const grouped = reservations.reduce((acc: any, res: any) => {
      // Utiliser la date de création de la réservation pour le mois de paiement
      const date = new Date(res.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          period: date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
          totalRevenue: 0,
          reservationsCount: 0
        };
      }
      
      acc[monthKey].totalRevenue += Number(res.total_amount || 0);
      acc[monthKey].reservationsCount += 1;
      
      return acc;
    }, {});

    // Convertir en tableau et calculer les frais selon le forfait
    return Object.entries(grouped).map(([key, data]: [string, any]) => {
      const serviceFees = data.totalRevenue * commissionRate;
      const netPayment = data.totalRevenue - serviceFees;
      
      // Le paiement est effectué le 5 du mois suivant
      const [year, month] = key.split('-');
      const paymentMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1;
      const paymentYear = parseInt(month) === 12 ? parseInt(year) + 1 : parseInt(year);
      
      return {
        id: key,
        period: data.period,
        totalRevenue: data.totalRevenue,
        serviceFees,
        netPayment,
        reservationsCount: data.reservationsCount,
        status: 'paid' as const,
        paymentDate: `${paymentYear}-${String(paymentMonth).padStart(2, '0')}-05`
      };
    });
  };

  const handleExport = () => {
    // Exporter les données en CSV
    const csv = convertToCSV(reports);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-paiements-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const convertToCSV = (data: PaymentReport[]): string => {
    const headers = ['Période', 'Revenus totaux', 'Frais de service', 'Paiement net', 'Nombre de réservations', 'Statut'];
    const rows = data.map(r => [
      r.period,
      r.totalRevenue.toFixed(2),
      r.serviceFees.toFixed(2),
      r.netPayment.toFixed(2),
      r.reservationsCount.toString(),
      r.status
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  if (loading) {
    return <div className="text-center py-8">Chargement des rapports...</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Rapports de Revenus</h3>
        <div className="flex space-x-2">
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
          >
            <option value="all">Toutes les périodes</option>
            <option value="month">Ce mois</option>
            <option value="year">Cette année</option>
          </select>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Exporter</span>
          </button>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-12">
          <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucun rapport de revenus disponible</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map(report => (
            <div key={report.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">{report.period}</h4>
                  <p className="text-sm text-gray-500">{report.reservationsCount} réservation(s)</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  report.status === 'paid' ? 'bg-green-100 text-green-800' :
                  report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {report.status === 'paid' ? 'Payé' : report.status === 'pending' ? 'En attente' : 'En cours'}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Revenus totaux</p>
                  <p className="text-lg font-bold text-gray-900">{report.totalRevenue.toFixed(2)} €</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Frais de service</p>
                  <p className="text-lg font-bold text-red-600">-{report.serviceFees.toFixed(2)} €</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Paiement net</p>
                  <p className="text-lg font-bold text-green-600">{report.netPayment.toFixed(2)} €</p>
                </div>
              </div>

              {report.paymentDate && (
                <p className="text-xs text-gray-500 mt-3">
                  Paiement effectué le: {new Date(report.paymentDate).toLocaleDateString('fr-FR')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentReports;

