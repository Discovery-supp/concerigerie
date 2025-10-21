import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type Property = Database['public']['Tables']['properties']['Row']
type PropertyInsert = Database['public']['Tables']['properties']['Insert']
type PropertyUpdate = Database['public']['Tables']['properties']['Update']

export const propertiesService = {
  // Récupérer toutes les propriétés actives
  async getProperties(filters?: {
    type?: string
    category?: string
    neighborhood?: string
    minPrice?: number
    maxPrice?: number
    amenities?: string[]
    beachAccess?: boolean
    minRating?: number
  }) {
    try {
      let query = supabase
        .from('properties')
        .select('*')
        .eq('is_published', true)

      // Appliquer les filtres
      if (filters?.type && filters.type !== 'all') {
        query = query.eq('type', filters.type)
      }

      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category)
      }

      if (filters?.neighborhood && filters.neighborhood !== 'all') {
        query = query.eq('neighborhood', filters.neighborhood)
      }

      if (filters?.minPrice) {
        query = query.gte('price_per_night', filters.minPrice)
      }

      if (filters?.maxPrice) {
        query = query.lte('price_per_night', filters.maxPrice)
      }

      if (filters?.beachAccess) {
        query = query.eq('beach_access', true)
      }

      if (filters?.amenities && filters.amenities.length > 0) {
        query = query.contains('amenities', filters.amenities)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erreur Supabase:', error)
        throw error
      }

      console.log('Properties fetched:', data?.length)

      // Récupérer les reviews séparément pour chaque propriété
      const propertiesWithRating = await Promise.all((data || []).map(async (property) => {
        const { data: reviews } = await supabase
          .from('reviews')
          .select('rating')
          .eq('property_id', property.id)

        const avgRating = reviews && reviews.length > 0
          ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
          : 0

        return {
          ...property,
          rating: avgRating,
          reviewsCount: reviews?.length || 0
        }
      }))

      // Filtrer par note si spécifié
      if (filters?.minRating) {
        return propertiesWithRating.filter(property => property.rating >= filters.minRating!)
      }

      return propertiesWithRating
    } catch (error) {
      console.error('Erreur récupération propriétés:', error)
      throw error
    }
  },

  // Récupérer une propriété par ID
  async getPropertyById(id: string) {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          owner:user_profiles!properties_owner_id_fkey(first_name, last_name),
          reviews(*, reviewer:user_profiles!reviews_reviewer_id_fkey(first_name, last_name))
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      // Calculer la note moyenne
      const reviews = data.reviews as any[]
      const avgRating = reviews.length > 0 
        ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length
        : 0

      return {
        ...data,
        rating: avgRating,
        reviewsCount: reviews.length
      }
    } catch (error) {
      console.error('Erreur récupération propriété:', error)
      throw error
    }
  },

  // Créer une nouvelle propriété
  async createProperty(propertyData: PropertyInsert) {
    try {
      const { data, error } = await supabase
        .from('properties')
        .insert([propertyData])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erreur création propriété:', error)
      throw error
    }
  },

  // Mettre à jour une propriété
  async updateProperty(id: string, updates: PropertyUpdate) {
    try {
      const { data, error } = await supabase
        .from('properties')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erreur mise à jour propriété:', error)
      throw error
    }
  },

  // Supprimer une propriété
  async deleteProperty(id: string) {
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Erreur suppression propriété:', error)
      throw error
    }
  },

  // Récupérer les propriétés d'un propriétaire
  async getOwnerProperties(ownerId: string) {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          reservations(*)
        `)
        .eq('owner_id', ownerId)

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erreur récupération propriétés propriétaire:', error)
      throw error
    }
  }
}

export default propertiesService