import React, { useState, useEffect, useMemo } from 'react';
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
  Eye,
  LineChart,
  BarChart3,
  ArrowUpRight
} from 'lucide-react';

interface HostEarningsProps {
  hostId: string;
}

const HostEarnings: React.FC<HostEarningsProps> = ({ hostId }) => {
  const defaultEndDate = new Date().toISOString().split('T')[0];
  const startPreset = new Date();
  startPreset.setMonth(startPreset.getMonth() - 3);
  const defaultStartDate = startPreset.toISOString().split('T')[0];

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
  const [hostReservations, setHostReservations] = useState<any[]>([]);
  const [propertyTitles, setPropertyTitles] = useState<Record<string, string>>({});
  const [trendRange, setTrendRange] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [revenueModalOpen, setRevenueModalOpen] = useState(false);
  const [trendSeries, setTrendSeries] = useState<Array<{ label: string; value: number }>>([]);
  const [appliedRange, setAppliedRange] = useState<{ startDate: string; endDate: string }>({
    startDate: defaultStartDate,
    endDate: defaultEndDate
  });
  const [pendingRange, setPendingRange] = useState<{ startDate: string; endDate: string }>({
    startDate: defaultStartDate,
    endDate: defaultEndDate
  });
  const [rangeError, setRangeError] = useState<string | null>(null);

  useEffect(() => {
    loadHostData(appliedRange);
  }, [hostId, appliedRange.startDate, appliedRange.endDate]);

  useEffect(() => {
    if (hostReservations.length === 0) return;
    // Trigger recompute when range changes
    setTrendSeries(generateTrendSeries(hostReservations, trendRange));
  }, [hostReservations, trendRange]);

  const propertySummary = useMemo(() => {
    if (hostReservations.length === 0) return [];

    const summaryMap = new Map<string, { title: string; reservations: number; revenue: number; lastReservation: string }>();

    hostReservations.forEach(reservation => {
      const key = reservation.property_id;
      const existing = summaryMap.get(key) || {
        title: propertyTitles[key] || 'Propriété',
        reservations: 0,
        revenue: 0,
        lastReservation: ''
      };

      existing.reservations += 1;
      existing.revenue += Number(reservation.total_amount) || 0;

      const reservationDate = reservation.check_in || reservation.created_at;
      if (reservationDate && (!existing.lastReservation || new Date(reservationDate) > new Date(existing.lastReservation))) {
        existing.lastReservation = reservationDate;
      }

      summaryMap.set(key, existing);
    });

    return Array.from(summaryMap.values()).sort((a, b) => b.revenue - a.revenue);
  }, [hostReservations, propertyTitles]);

  const loadHostData = async (range?: { startDate?: string; endDate?: string }) => {
    try {
      setLoading(true);
      const [allPaymentsData, statsData] = await Promise.all([
        hostPaymentsService.getHostPayments(hostId),
        hostPaymentsService.getHostStats(
          hostId,
          range?.startDate ? new Date(range.startDate).toISOString() : undefined,
          range?.endDate ? new Date(range.endDate).toISOString() : undefined
        )
      ]);
      
      const filteredPayments = filterPaymentsByRange(allPaymentsData, range);
      setPayments(filteredPayments);
      setStats(statsData);
      await loadHostRevenueData(range);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const filterPaymentsByRange = (paymentsList: HostPayment[], range?: { startDate?: string; endDate?: string }) => {
    if (!range?.startDate && !range?.endDate) return paymentsList;

    const start = range?.startDate ? new Date(range.startDate) : null;
    const end = range?.endDate ? new Date(range.endDate) : null;

    return paymentsList.filter(payment => {
      const paymentDate = new Date(payment.year, payment.month - 1, 1);
      if (start && paymentDate < start) return false;
      if (end && paymentDate > end) return false;
      return true;
    });
  };

  const loadHostRevenueData = async (range?: { startDate?: string; endDate?: string }) => {
    try {
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('id, title')
        .eq('owner_id', hostId);

      if (propertiesError) throw propertiesError;
      if (!properties || properties.length === 0) {
        setHostReservations([]);
        setPropertyTitles({});
        setTrendSeries([]);
        return;
      }

      const titlesMap: Record<string, string> = {};
      const propertyIds: string[] = [];
      properties.forEach(property => {
        if (property?.id) {
          propertyIds.push(property.id);
          titlesMap[property.id] = property.title || 'Propriété';
        }
      });
      setPropertyTitles(titlesMap);

      if (propertyIds.length === 0) {
        setHostReservations([]);
        setTrendSeries([]);
        return;
      }

      let reservationsQuery = supabase
        .from('reservations')
        .select('id, property_id, total_amount, check_in, created_at, status, payment_status')
        .in('property_id', propertyIds)
        .in('status', ['confirmed', 'completed'])
        .order('check_in', { ascending: true });

      if (range?.startDate) {
        reservationsQuery = reservationsQuery.gte('check_in', range.startDate);
      }
      if (range?.endDate) {
        reservationsQuery = reservationsQuery.lte('check_in', range.endDate);
      }

      const { data: reservations, error: reservationsError } = await reservationsQuery;

      if (reservationsError) throw reservationsError;

      setHostReservations(reservations || []);
      setTrendSeries(generateTrendSeries(reservations || [], trendRange));
    } catch (err) {
      console.error('Erreur chargement revenus détaillés hôte:', err);
    }
  };

  const generateTrendSeries = (reservations: any[], range: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
    const buckets = new Map<string, { label: string; value: number; date: Date }>();

    reservations.forEach(reservation => {
      const rawDate = reservation.check_in || reservation.created_at;
      if (!rawDate) return;
      const date = new Date(rawDate);
      const amount = Number(reservation.total_amount) || 0;

      let key = '';
      let label = '';

      switch (range) {
        case 'daily':
          key = date.toISOString().split('T')[0];
          label = date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
          break;
        case 'weekly': {
          const weekNumber = getWeekNumber(date);
          key = `${date.getFullYear()}-W${weekNumber}`;
          label = `Sem. ${weekNumber}`;
          break;
        }
        case 'monthly':
          key = `${date.getFullYear()}-${date.getMonth() + 1}`;
          label = `${getMonthName(date.getMonth() + 1).slice(0, 3)} ${date.getFullYear().toString().slice(-2)}`;
          break;
        case 'yearly':
          key = `${date.getFullYear()}`;
          label = `${date.getFullYear()}`;
          break;
      }

      const existing = buckets.get(key) || { label, value: 0, date };
      existing.value += amount;
      existing.date = date;
      buckets.set(key, existing);
    });

    const sorted = Array.from(buckets.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
    return sorted.map(({ label, value }) => ({ label, value }));
  };

  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = Math.floor((date.getTime() - firstDayOfYear.getTime()) / 86400000);
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
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

  const handleApplyRange = () => {
    if (pendingRange.startDate && pendingRange.endDate) {
      if (new Date(pendingRange.startDate) > new Date(pendingRange.endDate)) {
        setRangeError('La date de début doit être antérieure à la date de fin.');
        return;
      }
    }
    setRangeError(null);
    setAppliedRange(pendingRange);
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
      {/* Filtres période */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-700">Filtrer les revenus</p>
          <p className="text-xs text-gray-500">
            Période actuelle : {new Date(appliedRange.startDate).toLocaleDateString('fr-FR')} → {new Date(appliedRange.endDate).toLocaleDateString('fr-FR')}
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 uppercase">Du</label>
            <input
              type="date"
              value={pendingRange.startDate}
              onChange={(e) => setPendingRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 uppercase">Au</label>
            <input
              type="date"
              value={pendingRange.endDate}
              onChange={(e) => setPendingRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
          <button
            onClick={handleApplyRange}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors text-sm font-medium"
          >
            Appliquer
          </button>
        </div>
      </div>
      {rangeError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
          {rangeError}
        </div>
      )}

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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Gains Mensuels</h3>
          <button
            onClick={() => setRevenueModalOpen(true)}
            className="px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
          >
            <LineChart className="w-4 h-4" />
            Analyse avancée
          </button>
        </div>
        <div className="space-y-3">
          {stats.monthlyBreakdown.length === 0 && (
            <p className="text-sm text-gray-500">Aucune donnée de paiement disponible.</p>
          )}
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
      {/* Modal Revenus Avancés */}
      {revenueModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-start justify-center overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-11/12 lg:w-3/4 mt-12 mb-8 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Analyse des revenus
                </h3>
                <p className="text-sm text-gray-500">
                  Comparatif des gains par période et répartition par propriété.
                </p>
              </div>
              <button
                onClick={() => setRevenueModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                Fermer ✕
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {(['daily', 'weekly', 'monthly', 'yearly'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setTrendRange(range)}
                  className={`px-3 py-1.5 rounded-full text-sm capitalize ${
                    trendRange === range ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {range === 'daily' ? 'Journalier' : range === 'weekly' ? 'Hebdo' : range === 'monthly' ? 'Mensuel' : 'Annuel'}
                </button>
              ))}
            </div>

            <div className="bg-gray-50 rounded-2xl p-6">
              {trendSeries.length === 0 ? (
                <p className="text-sm text-gray-500 text-center">Aucune donnée disponible pour cette période.</p>
              ) : (
                <div className="h-64 flex items-end gap-3">
                  {trendSeries.map(point => {
                    const max = Math.max(...trendSeries.map(p => p.value));
                    const heightPercent = max > 0 ? (point.value / max) * 100 : 5;
                    return (
                      <div key={point.label} className="flex flex-col items-center flex-1">
                        <div
                          className="w-full max-w-[32px] bg-blue-200 rounded-t-lg flex items-end justify-center transition-all"
                          style={{ height: `${heightPercent}%` }}
                        >
                          <span className="text-[10px] text-blue-800 font-semibold rotate-[-90deg] origin-bottom hidden sm:block">
                            {formatCurrency(point.value)}
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-600 mt-2">{point.label}</span>
                        <span className="text-[10px] text-gray-400 sm:hidden">{formatCurrency(point.value)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">Résumé par propriété</p>
                <p className="text-xs text-gray-400">Basé sur les réservations confirmées/completées</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wide">
                    <tr>
                      <th className="px-4 py-2 text-left">Propriété</th>
                      <th className="px-4 py-2 text-left">Réservations</th>
                      <th className="px-4 py-2 text-left">Revenus</th>
                      <th className="px-4 py-2 text-left">Dernière réservation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {propertySummary.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                          Aucune propriété n’a encore généré de revenus.
                        </td>
                      </tr>
                    ) : (
                      propertySummary.map((property, index) => (
                        <tr key={index} className="border-t border-gray-100">
                          <td className="px-4 py-3 font-medium text-gray-900">{property.title}</td>
                          <td className="px-4 py-3 text-gray-600">{property.reservations}</td>
                          <td className="px-4 py-3 text-gray-900 font-semibold">{formatCurrency(property.revenue)}</td>
                          <td className="px-4 py-3 text-gray-500">
                            {property.lastReservation
                              ? new Date(property.lastReservation).toLocaleDateString('fr-FR')
                              : '–'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 flex items-center gap-3 text-sm text-blue-800">
              <ArrowUpRight className="w-5 h-5" />
              Cette vue est réservée aux hôtes et ne prend en compte que vos propriétés.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HostEarnings;

