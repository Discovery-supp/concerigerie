import { supabase } from '../lib/supabase';

export interface ConsultationMessage {
  id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address?: string;
  subject: string;
  message: string;
  created_at?: string;
  status?: 'new' | 'read' | 'replied';
}

class ConsultationService {
  async saveConsultationMessage(messageData: Omit<ConsultationMessage, 'id' | 'created_at'>): Promise<ConsultationMessage> {
    try {
      const { data, error } = await supabase
        .from('consultation_messages')
        .insert([
          {
            first_name: messageData.first_name,
            last_name: messageData.last_name,
            email: messageData.email,
            phone: messageData.phone,
            address: messageData.address || null,
            subject: messageData.subject,
            message: messageData.message,
            status: 'new'
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de l\'enregistrement du message:', error);
        throw new Error(`Erreur lors de l'enregistrement: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Erreur ConsultationService.saveConsultationMessage:', error);
      throw error;
    }
  }

  async getConsultationMessages(): Promise<ConsultationMessage[]> {
    try {
      const { data, error } = await supabase
        .from('consultation_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des messages:', error);
        throw new Error(`Erreur lors de la récupération: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Erreur ConsultationService.getConsultationMessages:', error);
      throw error;
    }
  }

  async updateMessageStatus(messageId: string, status: 'new' | 'read' | 'replied'): Promise<void> {
    try {
      const { error } = await supabase
        .from('consultation_messages')
        .update({ status })
        .eq('id', messageId);

      if (error) {
        console.error('Erreur lors de la mise à jour du statut:', error);
        throw new Error(`Erreur lors de la mise à jour: ${error.message}`);
      }
    } catch (error) {
      console.error('Erreur ConsultationService.updateMessageStatus:', error);
      throw error;
    }
  }
}

const consultationService = new ConsultationService();
export default consultationService;





