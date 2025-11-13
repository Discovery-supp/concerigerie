import { supabase, isSupabaseConfigured } from '../lib/supabase'
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
    destination?: string
    minGuests?: number
  }) {
    if (!isSupabaseConfigured) {
      return []
    }
    
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

      if (filters?.minGuests) {
        query = query.gte('max_guests', filters.minGuests)
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
      let filteredProperties = propertiesWithRating
      
      if (filters?.minRating) {
        filteredProperties = filteredProperties.filter(property => property.rating >= filters.minRating!)
      }

      // Filtrer par destination (recherche dans titre, adresse, quartier, location)
      if (filters?.destination) {
        const destinationLower = filters.destination.toLowerCase()
        filteredProperties = filteredProperties.filter(property => {
          const title = (property.title || '').toLowerCase()
          const address = (property.address || '').toLowerCase()
          const neighborhood = (property.neighborhood || '').toLowerCase()
          const location = (property.location || '').toLowerCase()
          
          return title.includes(destinationLower) ||
                 address.includes(destinationLower) ||
                 neighborhood.includes(destinationLower) ||
                 location.includes(destinationLower)
        })
      }

      return filteredProperties
    } catch (error) {
      console.error('Erreur récupération propriétés:', error)
      throw error
    }
  },

  // Récupérer une propriété par ID
  async getPropertyById(id: string) {
    try {
      console.log('Recherche propriété avec ID:', id);
      
      // D'abord, essayer avec les jointures
      let { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          owner:user_profiles!properties_owner_id_fkey(first_name, last_name),
          reviews(*, reviewer:user_profiles!reviews_reviewer_id_fkey(first_name, last_name))
        `)
        .eq('id', id)
        .single()

      // Si la requête avec jointures échoue, essayer sans jointures
      if (error) {
        console.warn('Erreur avec jointures, tentative sans jointures:', error);
        console.warn('Code erreur:', error.code, 'Message:', error.message);
        
        // Essayer sans jointures et sans restriction is_published (pour permettre de voir les propriétés non publiées)
        const { data: simpleData, error: simpleError } = await supabase
          .from('properties')
          .select('*')
          .eq('id', id)
          .maybeSingle() // Utiliser maybeSingle au lieu de single pour éviter l'erreur si non trouvé

        if (simpleError) {
          console.error('Erreur récupération propriété (sans jointures):', simpleError);
          console.error('Code erreur:', simpleError.code, 'Message:', simpleError.message);
          throw simpleError;
        }

        if (!simpleData) {
          console.error('Aucune propriété trouvée avec l\'ID:', id);
          throw new Error(`Propriété avec l'ID ${id} non trouvée dans la base de données`);
        }

        data = simpleData;
        
        // Charger les reviews séparément
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('*')
          .eq('property_id', id);

        const reviews = reviewsData || [];
        const avgRating = reviews.length > 0 
          ? reviews.reduce((sum: number, review: any) => sum + (review.rating || 0), 0) / reviews.length
          : 0

        return {
          ...data,
          reviews: reviews,
          owner: null,
          rating: avgRating,
          reviewsCount: reviews.length
        }
      }

      if (!data) {
        throw new Error('Propriété non trouvée');
      }

      // Calculer la note moyenne
      const reviews = (data.reviews as any[]) || []
      const avgRating = reviews.length > 0 
        ? reviews.reduce((sum: number, review: any) => sum + (review.rating || 0), 0) / reviews.length
        : 0

      console.log('Propriété trouvée:', data.title);
      console.log('Nombre de reviews:', reviews.length);

      return {
        ...data,
        rating: avgRating,
        reviewsCount: reviews.length
      }
    } catch (error: any) {
      console.error('Erreur récupération propriété:', error);
      console.error('Message d\'erreur:', error.message);
      console.error('Code d\'erreur:', error.code);
      console.error('Détails:', error);
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