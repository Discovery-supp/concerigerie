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
      
      // Charger la propriété sans jointures (plus fiable)
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (propertyError) {
        console.error('Erreur récupération propriété:', propertyError);
        throw propertyError;
      }

      if (!propertyData) {
        throw new Error(`Propriété avec l'ID ${id} non trouvée dans la base de données`);
      }

      // Charger les reviews séparément
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .eq('property_id', id)
        .order('created_at', { ascending: false });

      if (reviewsError) {
        console.warn('Erreur chargement reviews:', reviewsError);
      }

      const reviews = reviewsData || [];
      const avgRating = reviews.length > 0 
        ? reviews.reduce((sum: number, review: any) => sum + (review.rating || 0), 0) / reviews.length
        : 0

      // Charger les infos du propriétaire séparément si nécessaire
      let owner = null;
      if (propertyData.owner_id) {
        try {
          const { data: ownerData } = await supabase
            .from('user_profiles')
            .select('id, first_name, last_name')
            .eq('id', propertyData.owner_id)
            .maybeSingle();
          
          if (ownerData) {
            owner = {
              first_name: ownerData.first_name,
              last_name: ownerData.last_name
            };
          }
        } catch (ownerError) {
          console.warn('Erreur chargement propriétaire:', ownerError);
        }
      }

      console.log('Propriété trouvée:', propertyData.title);
      console.log('Nombre de reviews:', reviews.length);

      return {
        ...propertyData,
        reviews: reviews,
        owner: owner,
        rating: avgRating,
        reviewsCount: reviews.length
      }
    } catch (error: any) {
      console.error('Erreur récupération propriété:', error);
      console.error('Message d\'erreur:', error.message);
      console.error('Code d\'erreur:', error.code);
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