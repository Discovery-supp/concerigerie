import { supabase } from '../lib/supabase';

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'mobile_money' | 'bank_card' | 'bank_transfer' | 'cash';
  provider: string;
  is_active: boolean;
  icon?: string;
}

export interface Transaction {
  id?: string;
  reservation_id: string;
  user_id: string;
  amount: number;
  currency: 'USD' | 'CDF';
  payment_method_id: string;
  payment_method_type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  transaction_reference?: string;
  phone_number?: string;
  payment_details?: Record<string, any>;
  error_message?: string;
}

export const paymentsService = {
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true)
        .order('type, name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      throw error;
    }
  },

  async createTransaction(transactionData: Omit<Transaction, 'id'>): Promise<Transaction> {
    try {
      const transactionReference = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const { data, error } = await supabase
        .from('transactions')
        .insert({
          ...transactionData,
          transaction_reference: transactionReference,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  },

  async updateTransactionStatus(
    transactionId: string,
    status: Transaction['status'],
    errorMessage?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          status,
          error_message: errorMessage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', transactionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating transaction status:', error);
      throw error;
    }
  },

  async getUserTransactions(userId: string): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          reservation:reservations(
            id,
            check_in,
            check_out,
            property:properties(title)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user transactions:', error);
      throw error;
    }
  },

  async processPayment(
    transactionId: string,
    paymentMethodType: string,
    paymentDetails: Record<string, any>
  ): Promise<{ success: boolean; message: string }> {
    try {
      await paymentsService.updateTransactionStatus(transactionId, 'processing');

      switch (paymentMethodType) {
        case 'mobile_money':
          return await paymentsService.processMobileMoneyPayment(transactionId, paymentDetails);

        case 'bank_card':
          return await paymentsService.processBankCardPayment(transactionId, paymentDetails);

        case 'bank_transfer':
          return await paymentsService.processBankTransferPayment(transactionId, paymentDetails);

        case 'cash':
          return await paymentsService.processCashPayment(transactionId);

        default:
          throw new Error('Méthode de paiement non supportée');
      }
    } catch (error: any) {
      await paymentsService.updateTransactionStatus(transactionId, 'failed', error.message);
      throw error;
    }
  },

  async processMobileMoneyPayment(
    transactionId: string,
    details: { phone_number: string; provider: string }
  ): Promise<{ success: boolean; message: string }> {
    await new Promise(resolve => setTimeout(resolve, 2000));

    await paymentsService.updateTransactionStatus(transactionId, 'completed');

    return {
      success: true,
      message: `Paiement Mobile Money initié. Composez *123# sur votre téléphone ${details.phone_number} pour confirmer le paiement.`
    };
  },

  async processBankCardPayment(
    transactionId: string,
    details: { card_number: string; expiry: string; cvv: string }
  ): Promise<{ success: boolean; message: string }> {
    await new Promise(resolve => setTimeout(resolve, 1500));

    await paymentsService.updateTransactionStatus(transactionId, 'completed');

    return {
      success: true,
      message: 'Paiement par carte bancaire effectué avec succès.'
    };
  },

  async processBankTransferPayment(
    transactionId: string,
    details: Record<string, any>
  ): Promise<{ success: boolean; message: string }> {
    await paymentsService.updateTransactionStatus(transactionId, 'pending');

    return {
      success: true,
      message: 'Instructions de virement bancaire envoyées par email. Votre réservation sera confirmée après réception du paiement.'
    };
  },

  async processCashPayment(transactionId: string): Promise<{ success: boolean; message: string }> {
    await paymentsService.updateTransactionStatus(transactionId, 'pending');

    return {
      success: true,
      message: 'Paiement en espèces sélectionné. Veuillez effectuer le paiement lors du check-in.'
    };
  },

  async updateReservationPaymentStatus(reservationId: string, paymentStatus: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ payment_status: paymentStatus })
        .eq('id', reservationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating reservation payment status:', error);
      throw error;
    }
  }
};

export default paymentsService;
