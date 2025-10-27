import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type ServiceProvider = Database['public']['Tables']['service_providers']['Row']
type ServiceProviderInsert = Database['public']['Tables']['service_providers']['Insert']
type ServiceProviderUpdate = Database['public']['Tables']['service_providers']['Update']

export const serviceProvidersService = {
  // Créer un prestataire de services
  async createServiceProvider(providerData: ServiceProviderInsert) {
    try {
      const { data, error } = await supabase
        .from('service_providers')
        .insert([providerData])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erreur création prestataire:', error)
      throw error
    }
  },

  // Récupérer un prestataire par ID utilisateur
  async getServiceProviderByUserId(userId: string) {
    try {
      const { data, error } = await supabase
        .from('service_providers')
        .select(`
          *,
          users!service_providers_user_id_fkey(*)
        `)
        .eq('user_id', userId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erreur récupération prestataire:', error)
      throw error
    }
  },

  // Récupérer tous les prestataires vérifiés
  async getVerifiedProviders(filters?: {
    services?: string[]
    zones?: string[]
    minRating?: number
  }) {
    try {
      let query = supabase
        .from('service_providers')
        .select(`
          *,
          users!service_providers_user_id_fkey(first_name, last_name, phone, email)
        `)
        .eq('is_verified', true)

      if (filters?.services && filters.services.length > 0) {
        query = query.overlaps('services', filters.services)
      }

      if (filters?.zones && filters.zones.length > 0) {
        query = query.overlaps('intervention_zones', filters.zones)
      }

      if (filters?.minRating) {
        query = query.gte('rating', filters.minRating)
      }

      const { data, error } = await query

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erreur récupération prestataires vérifiés:', error)
      throw error
    }
  },

  // Mettre à jour un prestataire
  async updateServiceProvider(id: string, updates: ServiceProviderUpdate) {
    try {
      const { data, error } = await supabase
        .from('service_providers')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erreur mise à jour prestataire:', error)
      throw error
    }
  },

  // Rechercher prestataires par service
  async searchProviders(searchTerm: string) {
    try {
      const { data, error } = await supabase
        .from('service_providers')
        .select(`
          *,
          users!service_providers_user_id_fkey(first_name, last_name, phone)
        `)
        .eq('is_verified', true)
        .or(`services.cs.{${searchTerm}},users.first_name.ilike.%${searchTerm}%,users.last_name.ilike.%${searchTerm}%`)

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erreur recherche prestataires:', error)
      throw error
    }
  }
}

export default serviceProvidersService