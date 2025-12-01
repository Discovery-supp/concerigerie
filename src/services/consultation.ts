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
        .maybeSingle();

      if (error) {
        console.error('Erreur lors de l\'enregistrement du message:', error);
        throw new Error(`Erreur lors de l'enregistrement: ${error.message}`);
      }

      // Créer une notification pour tous les admins / super_admins
      try {
        let adminIds: string[] = []
        
        // Utiliser la fonction SQL qui bypass RLS
        const { data: adminData, error: functionError } = await supabase
          .rpc('get_all_admin_ids')

        if (!functionError && adminData && adminData.length > 0) {
          adminIds = adminData.map((admin: any) => admin.admin_id)
          console.log('[consultation] Admins trouvés via fonction SQL:', adminIds.length)
        } else {
          // Fallback: essayer la requête directe
          console.warn('[consultation] Fonction SQL échouée, tentative requête directe:', functionError)
          const { data: admins, error: adminsError } = await supabase
            .from('user_profiles')
            .select('id')
            .in('user_type', ['admin', 'super_admin']);

          if (adminsError) {
            console.warn('Erreur lors du chargement des admins pour la notification de consultation:', adminsError);
          } else if (admins && admins.length > 0) {
            adminIds = admins.map(admin => admin.id)
            console.log('[consultation] Admins trouvés via requête directe:', adminIds.length)
          }
        }

        if (adminIds.length > 0) {
          const notifications = adminIds.map((adminId) => ({
            user_id: adminId,
            type: 'consultation_message',
            title: 'Nouveau message de contact',
            message: `Nouveau message de ${messageData.first_name} ${messageData.last_name} : "${messageData.subject}"`,
            data: {
              consultation_message_id: data.id,
              email: messageData.email,
              phone: messageData.phone,
              subject: messageData.subject,
              created_at: data.created_at
            },
            is_read: false
          }));

          const { error: notifError } = await supabase
            .from('notifications')
            .insert(notifications);

          if (notifError) {
            console.warn('Erreur lors de la création des notifications admin (consultation):', notifError);
          } else {
            console.log('[consultation] Notifications créées pour', adminIds.length, 'admin(s)')
          }
        } else {
          console.warn('[consultation] Aucun admin trouvé pour envoyer les notifications')
        }
      } catch (notifException) {
        console.warn('Exception lors de la création des notifications admin (consultation):', notifException);
      }

      // data peut être null si maybeSingle ne retourne rien, mais l'insertion a réussi.
      // Dans ce cas, on renvoie un objet reconstruit à partir des données envoyées.
      return data ?? {
        id: undefined,
        first_name: messageData.first_name,
        last_name: messageData.last_name,
        email: messageData.email,
        phone: messageData.phone,
        address: messageData.address,
        subject: messageData.subject,
        message: messageData.message,
        status: 'new'
      };
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

