import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type HostProfile = Database['public']['Tables']['host_profiles']['Row']
type HostProfileInsert = Database['public']['Tables']['host_profiles']['Insert']
type HostProfileUpdate = Database['public']['Tables']['host_profiles']['Update']

export const DEFAULT_ALERT_PREFERENCES = {
  booking: true,
  payments: true,
  reviews: true,
  newsletter: false
}

export const hostProfilesService = {
  // Créer un profil hôte
  async createHostProfile(profileData: HostProfileInsert) {
    try {
      const { data, error } = await supabase
        .from('host_profiles')
        .insert([profileData])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erreur création profil hôte:', error)
      throw error
    }
  },

  async ensureHostProfile(userId: string) {
    try {
      return await this.getHostProfile(userId)
    } catch (error: any) {
      const message = error?.message || ''
      if (message.includes('No rows') || error?.code === 'PGRST116') {
        return await this.createHostProfile({
          user_id: userId,
          selected_package: 'starter',
          commission_rate: 15,
          description: null,
          languages: [],
          profession: null,
          interests: [],
          why_host: null,
          hosting_frequency: null,
          accommodation_type: null,
          guest_types: [],
          stay_duration: null,
          payment_method: 'bank_transfer',
          bank_account: null,
          bank_name: null,
          bank_country: null,
          mobile_number: null,
          mobile_name: null,
          mobile_city: null,
          mobile_network: null,
          is_verified: false,
          is_active: true,
          alert_preferences: DEFAULT_ALERT_PREFERENCES,
          preferred_provider_ids: []
        })
      }
      throw error
    }
  },

  // Récupérer le profil d'un hôte
  async getHostProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('host_profiles')
        .select(`
          *,
          users!host_profiles_user_id_fkey(*)
        `)
        .eq('user_id', userId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erreur récupération profil hôte:', error)
      throw error
    }
  },

  // Mettre à jour un profil hôte
  async updateHostProfile(id: string, updates: HostProfileUpdate) {
    try {
      const { data, error } = await supabase
        .from('host_profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erreur mise à jour profil hôte:', error)
      throw error
    }
  },

  // Récupérer tous les hôtes vérifiés
  async getVerifiedHosts() {
    try {
      const { data, error } = await supabase
        .from('host_profiles')
        .select(`
          *,
          users!host_profiles_user_id_fkey(first_name, last_name, profile_image)
        `)
        .eq('is_verified', true)

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erreur récupération hôtes vérifiés:', error)
      throw error
    }
  }
}

export default hostProfilesService