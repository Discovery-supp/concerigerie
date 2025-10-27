import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type HostProfile = Database['public']['Tables']['host_profiles']['Row']
type HostProfileInsert = Database['public']['Tables']['host_profiles']['Insert']
type HostProfileUpdate = Database['public']['Tables']['host_profiles']['Update']

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