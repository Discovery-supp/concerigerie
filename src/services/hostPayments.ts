import { supabase } from '../lib/supabase';

export interface CommissionSettings {
  id: string;
  commission_percentage: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HostPayment {
  id: string;
  host_id: string;
  month: number;
  year: number;
  total_reservations: number;
  total_revenue: number;
  commission_amount: number;
  host_earnings: number;
  payment_status: 'pending' | 'processing' | 'paid' | 'failed';
  payment_method?: string;
  payment_reference?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
  host?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface HostPaymentDetail {
  id: string;
  host_payment_id: string;
  reservation_id: string;
  reservation_amount: number;
  commission_amount: number;
  host_amount: number;
  created_at: string;
  reservation?: {
    id: string;
    check_in: string;
    check_out: string;
    property: {
      title: string;
    };
  };
}

export interface AppEarnings {
  id: string;
  month: number;
  year: number;
  total_reservations: number;
  total_revenue: number;
  total_commission: number;
  total_host_payments: number;
  net_earnings: number;
  created_at: string;
  updated_at: string;
}

export const hostPaymentsService = {
  // Récupérer les paramètres de commission
  async getCommissionSettings(): Promise<CommissionSettings> {
    try {
      const { data, error } = await supabase
        .from('commission_settings')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur récupération paramètres commission:', error);
      throw error;
    }
  },

  // Mettre à jour les paramètres de commission (admin seulement)
  async updateCommissionSettings(percentage: number): Promise<CommissionSettings> {
    try {
      // Désactiver l'ancien paramètre
      await supabase
        .from('commission_settings')
        .update({ is_active: false })
        .eq('is_active', true);

      // Créer le nouveau paramètre
      const { data, error } = await supabase
        .from('commission_settings')
        .insert({
          commission_percentage: percentage,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur mise à jour paramètres commission:', error);
      throw error;
    }
  },

  // Calculer les paiements pour un mois donné
  async calculateHostPayments(month: number, year: number): Promise<void> {
    try {
      const { error } = await supabase.rpc('calculate_host_payments', {
        target_month: month,
        target_year: year
      });

      if (error) throw error;
    } catch (error) {
      console.error('Erreur calcul paiements hôtes:', error);
      throw error;
    }
  },

  // Récupérer les paiements d'un hôte
  async getHostPayments(hostId: string): Promise<HostPayment[]> {
    try {
      const { data, error } = await supabase
        .from('host_payments')
        .select(`
          *,
          host:user_profiles(first_name, last_name, email)
        `)
        .eq('host_id', hostId)
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur récupération paiements hôte:', error);
      throw error;
    }
  },

  // Récupérer tous les paiements (admin seulement)
  async getAllHostPayments(): Promise<HostPayment[]> {
    try {
      const { data, error } = await supabase
        .from('host_payments')
        .select(`
          *,
          host:user_profiles(first_name, last_name, email)
        `)
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur récupération tous paiements:', error);
      throw error;
    }
  },

  // Récupérer les détails d'un paiement
  async getHostPaymentDetails(paymentId: string): Promise<HostPaymentDetail[]> {
    try {
      const { data, error } = await supabase
        .from('host_payment_details')
        .select(`
          *,
          reservation:reservations(
            id,
            check_in,
            check_out,
            property:properties(title)
          )
        `)
        .eq('host_payment_id', paymentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur récupération détails paiement:', error);
      throw error;
    }
  },

  // Marquer un paiement comme effectué
  async markPaymentAsPaid(
    paymentId: string,
    paymentMethod: string,
    paymentReference: string
  ): Promise<void> {
    try {
      const { error } = await supabase.rpc('mark_host_payment_paid', {
        payment_id: paymentId,
        payment_method_param: paymentMethod,
        payment_reference_param: paymentReference
      });

      if (error) throw error;
    } catch (error) {
      console.error('Erreur marquage paiement effectué:', error);
      throw error;
    }
  },

  // Récupérer les statistiques globales de l'application
  async getAppEarnings(): Promise<AppEarnings[]> {
    try {
      const { data, error } = await supabase
        .from('app_earnings')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur récupération statistiques app:', error);
      throw error;
    }
  },

  // Récupérer les statistiques d'un hôte pour une période
  async getHostStats(hostId: string, startDate?: string, endDate?: string): Promise<{
    totalEarnings: number;
    totalReservations: number;
    totalCommission: number;
    averageEarningsPerReservation: number;
    monthlyBreakdown: Array<{
      month: number;
      year: number;
      earnings: number;
      reservations: number;
    }>;
  }> {
    try {
      let query = supabase
        .from('host_payments')
        .select('*')
        .eq('host_id', hostId);

      if (startDate && endDate) {
        query = query
          .gte('created_at', startDate)
          .lte('created_at', endDate);
      }

      const { data, error } = await query.order('year', { ascending: false })
        .order('month', { ascending: false });

      if (error) throw error;

      const payments = data || [];
      const totalEarnings = payments.reduce((sum, p) => sum + Number(p.host_earnings), 0);
      const totalReservations = payments.reduce((sum, p) => sum + p.total_reservations, 0);
      const totalCommission = payments.reduce((sum, p) => sum + Number(p.commission_amount), 0);
      const averageEarningsPerReservation = totalReservations > 0 ? totalEarnings / totalReservations : 0;

      const monthlyBreakdown = payments.map(p => ({
        month: p.month,
        year: p.year,
        earnings: Number(p.host_earnings),
        reservations: p.total_reservations
      }));

      return {
        totalEarnings,
        totalReservations,
        totalCommission,
        averageEarningsPerReservation,
        monthlyBreakdown
      };
    } catch (error) {
      console.error('Erreur récupération statistiques hôte:', error);
      throw error;
    }
  },

  // Récupérer les statistiques globales de l'application pour une période
  async getAppStats(startDate?: string, endDate?: string): Promise<{
    totalRevenue: number;
    totalCommission: number;
    totalHostPayments: number;
    netEarnings: number;
    totalReservations: number;
    monthlyBreakdown: Array<{
      month: number;
      year: number;
      revenue: number;
      commission: number;
      hostPayments: number;
      netEarnings: number;
      reservations: number;
    }>;
  }> {
    try {
      let query = supabase
        .from('app_earnings')
        .select('*');

      if (startDate && endDate) {
        query = query
          .gte('created_at', startDate)
          .lte('created_at', endDate);
      }

      const { data, error } = await query.order('year', { ascending: false })
        .order('month', { ascending: false });

      if (error) throw error;

      const earnings = data || [];
      const totalRevenue = earnings.reduce((sum, e) => sum + Number(e.total_revenue), 0);
      const totalCommission = earnings.reduce((sum, e) => sum + Number(e.total_commission), 0);
      const totalHostPayments = earnings.reduce((sum, e) => sum + Number(e.total_host_payments), 0);
      const netEarnings = earnings.reduce((sum, e) => sum + Number(e.net_earnings), 0);
      const totalReservations = earnings.reduce((sum, e) => sum + e.total_reservations, 0);

      const monthlyBreakdown = earnings.map(e => ({
        month: e.month,
        year: e.year,
        revenue: Number(e.total_revenue),
        commission: Number(e.total_commission),
        hostPayments: Number(e.total_host_payments),
        netEarnings: Number(e.net_earnings),
        reservations: e.total_reservations
      }));

      return {
        totalRevenue,
        totalCommission,
        totalHostPayments,
        netEarnings,
        totalReservations,
        monthlyBreakdown
      };
    } catch (error) {
      console.error('Erreur récupération statistiques app:', error);
      throw error;
    }
  }
};

export default hostPaymentsService;

