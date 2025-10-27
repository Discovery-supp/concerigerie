import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type Review = Database['public']['Tables']['reviews']['Row']
type ReviewInsert = Database['public']['Tables']['reviews']['Insert']

export const reviewsService = {
  // Créer un avis
  async createReview(reviewData: ReviewInsert) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert([reviewData])
        .select(`
          *,
          users!reviews_guest_id_fkey(first_name, last_name, profile_image)
        `)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erreur création avis:', error)
      throw error
    }
  },

  // Récupérer les avis d'une propriété
  async getPropertyReviews(propertyId: string) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          users!reviews_guest_id_fkey(first_name, last_name, profile_image)
        `)
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erreur récupération avis propriété:', error)
      throw error
    }
  },

  // Récupérer les avis d'un utilisateur
  async getUserReviews(userId: string) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          properties(title, images),
          reservations(check_in, check_out)
        `)
        .eq('guest_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erreur récupération avis utilisateur:', error)
      throw error
    }
  },

  // Calculer la note moyenne d'une propriété
  async getPropertyAverageRating(propertyId: string) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('property_id', propertyId)

      if (error) throw error

      if (data.length === 0) return { average: 0, count: 0 }

      const average = data.reduce((sum, review) => sum + review.rating, 0) / data.length
      return { average: Math.round(average * 10) / 10, count: data.length }
    } catch (error) {
      console.error('Erreur calcul note moyenne:', error)
      throw error
    }
  }
}

export default reviewsService