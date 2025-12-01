import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Home, Users } from 'lucide-react';

interface PerformanceStatsProps {
  occupancyRate: number;
  revenue: number;
  monthlyRevenue: number;
  previousMonthRevenue: number;
  totalReservations: number;
  totalProperties?: number;
}

const PerformanceStats: React.FC<PerformanceStatsProps> = ({
  occupancyRate,
  revenue,
  monthlyRevenue,
  previousMonthRevenue,
  totalReservations,
  totalProperties
}) => {
  const revenueChange = previousMonthRevenue > 0
    ? ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
    : 0;

  const occupancyChange = 5; // À calculer depuis les données réelles

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Statistiques de Performance</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Taux d'occupation */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Home className="w-8 h-8 text-blue-600" />
            {occupancyChange > 0 ? (
              <TrendingUp className="w-5 h-5 text-green-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-600" />
            )}
          </div>
          <p className="text-sm text-gray-600 mb-1">Taux d'occupation</p>
          <p className="text-2xl font-bold text-gray-900">{occupancyRate.toFixed(1)}%</p>
          <p className={`text-xs mt-1 ${occupancyChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {occupancyChange > 0 ? '+' : ''}{occupancyChange}% vs mois dernier
          </p>
        </div>

        {/* Revenus totaux */}
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 text-green-600" />
            {revenueChange > 0 ? (
              <TrendingUp className="w-5 h-5 text-green-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-600" />
            )}
          </div>
          <p className="text-sm text-gray-600 mb-1">Revenus totaux</p>
          <p className="text-2xl font-bold text-gray-900">{revenue.toFixed(2)} €</p>
          <p className={`text-xs mt-1 ${revenueChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {revenueChange > 0 ? '+' : ''}{revenueChange.toFixed(1)}% vs mois dernier
          </p>
        </div>

        {/* Revenus mensuels */}
        <div className="bg-yellow-50 rounded-lg p-4">
          <DollarSign className="w-8 h-8 text-yellow-600 mb-2" />
          <p className="text-sm text-gray-600 mb-1">Revenus ce mois</p>
          <p className="text-2xl font-bold text-gray-900">{monthlyRevenue.toFixed(2)} €</p>
          <p className="text-xs mt-1 text-gray-500">
            Mois précédent: {previousMonthRevenue.toFixed(2)} €
          </p>
        </div>

        {/* Réservations */}
        <div className="bg-purple-50 rounded-lg p-4">
          <Calendar className="w-8 h-8 text-purple-600 mb-2" />
          <p className="text-sm text-gray-600 mb-1">Réservations totales</p>
          <p className="text-2xl font-bold text-gray-900">{totalReservations}</p>
        </div>

        {/* Propriétés */}
        {totalProperties !== undefined && (
          <div className="bg-indigo-50 rounded-lg p-4">
            <Home className="w-8 h-8 text-indigo-600 mb-2" />
            <p className="text-sm text-gray-600 mb-1">Propriétés</p>
            <p className="text-2xl font-bold text-gray-900">{totalProperties}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceStats;

