import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type Reservation = Database['public']['Tables']['reservations']['Row']
type ReservationInsert = Database['public']['Tables']['reservations']['Insert']
type ReservationUpdate = Database['public']['Tables']['reservations']['Update']

type ReservationDetailOptions = {
  includeProperty?: boolean
  includeGuestProfile?: boolean
  propertyColumns?: string
  guestColumns?: string
}

const DEFAULT_PROPERTY_COLUMNS = 'id, title, address, images, owner_id, price_per_night'
const DEFAULT_GUEST_COLUMNS = 'id, first_name, last_name, email, phone, user_type'

async function attachReservationDetails(
  reservations: any[] | null | undefined,
  options: ReservationDetailOptions = {}
) {
  const {
    includeProperty = true,
    includeGuestProfile = false,
    propertyColumns = DEFAULT_PROPERTY_COLUMNS,
    guestColumns = DEFAULT_GUEST_COLUMNS
  } = options

  if (!Array.isArray(reservations) || reservations.length === 0) {
    return []
  }

  const enrichedReservations = reservations.map(res => ({ ...res }))

  if (includeProperty) {
    const propertyIds = [
      ...new Set(
        enrichedReservations
          .map(res => res.property_id)
          .filter(Boolean)
      )
    ]

    if (propertyIds.length > 0) {
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select(propertyColumns)
        .in('id', propertyIds)

      if (propertiesError) {
        console.warn('[reservationsService] Erreur chargement propriétés:', propertiesError)
      } else if (properties) {
        const propertiesMap = new Map(properties.map(property => [property.id, property]))
        enrichedReservations.forEach(reservation => {
          reservation.property = propertiesMap.get(reservation.property_id) || reservation.property || null
        })
      }
    }
  }

  if (includeGuestProfile) {
    const guestIds = [
      ...new Set(
        enrichedReservations
          .map(res => res.guest_id)
          .filter(Boolean)
      )
    ]

    if (guestIds.length > 0) {
      const { data: guests, error: guestError } = await supabase
        .from('user_profiles')
        .select(guestColumns)
        .in('id', guestIds)

      if (guestError) {
        console.warn('[reservationsService] Erreur chargement profils invités:', guestError)
      } else if (guests) {
        const guestsMap = new Map(guests.map(guest => [guest.id, guest]))
        enrichedReservations.forEach(reservation => {
          reservation.guest = guestsMap.get(reservation.guest_id) || reservation.guest || null
        })
      }
    }
  }

  return enrichedReservations
}

export const reservationsService = {
  // Créer une nouvelle réservation
  async createReservation(reservationData: ReservationInsert) {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .insert([reservationData])
        .select(`
          *,
          properties(*),
          users!reservations_guest_id_fkey(*)
        `)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erreur création réservation:', error)
      throw error
    }
  },

  // Récupérer les réservations d'un utilisateur
  async getUserReservations(userId: string) {
    try {
      // Charger les réservations sans jointures (plus fiable)
      const { data: reservations, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('guest_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erreur récupération réservations:', error)
        throw error
      }

      if (!reservations || reservations.length === 0) {
        console.log('[getUserReservations] Aucune réservation trouvée pour userId:', userId)
        return []
      }

      const reservationsWithDetails = await attachReservationDetails(reservations, {
        includeProperty: true
      })

      console.log('[getUserReservations] Réservations chargées:', reservationsWithDetails.length)
      return reservationsWithDetails
    } catch (error) {
      console.error('Erreur récupération réservations utilisateur:', error)
      throw error
    }
  },

  // Récupérer les réservations d'une propriété
  async getPropertyReservations(propertyId: string) {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          users!reservations_guest_id_fkey(*)
        `)
        .eq('property_id', propertyId)
        .order('check_in', { ascending: true })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erreur récupération réservations propriété:', error)
      throw error
    }
  },

  // Mettre à jour une réservation
  async updateReservation(id: string, updates: ReservationUpdate) {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erreur mise à jour réservation:', error)
      throw error
    }
  },

  // Annuler une réservation
  async cancelReservation(id: string) {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .update({ 
          status: 'cancelled',
          payment_status: 'refunded'
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erreur annulation réservation:', error)
      throw error
    }
  },

  // Demander l'annulation d'une réservation (pour les guests - notification à l'admin)
  async requestCancellation(reservationId: string, reason?: string) {
    try {
      // Récupérer les informations de la réservation sans jointures
      const { data: reservation, error: resError } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', reservationId)
        .single()

      if (resError) throw resError

      // Ajouter les données chargées à la réservation
      const [reservationWithData] = await attachReservationDetails([reservation], {
        includeProperty: true,
        includeGuestProfile: true
      })

      // Trouver tous les admins
      const { data: admins, error: adminError } = await supabase
        .from('user_profiles')
        .select('id')
        .in('user_type', ['admin', 'super_admin'])

      if (adminError) throw adminError

      // Créer une notification pour chaque admin
      if (admins && admins.length > 0) {
        const notifications = admins.map(admin => ({
          user_id: admin.id,
          type: 'cancellation_request',
          title: 'Demande d\'annulation de réservation',
          message: `Un voyageur demande l'annulation de sa réservation #${reservationId.substring(0, 8)}.${reason ? ` Raison: ${reason}` : ''}`,
          data: {
            reservation_id: reservationId,
            property_id: reservationWithData.property_id,
            guest_id: reservationWithData.guest_id,
            reason: reason || null,
            reservation: reservationWithData
          },
          is_read: false
        }))

        const { error: notifError } = await supabase
          .from('notifications')
          .insert(notifications)

        if (notifError) throw notifError
      }

      // Mettre à jour la réservation avec le statut de demande d'annulation
      // Mettre à jour le statut de la réservation.
      // Attention: certaines bases ne possèdent pas encore la colonne "cancellation_reason",
      // donc on ne l'utilise pas ici pour éviter l'erreur de schema cache.
      const { data: updatedReservation, error: updateError } = await supabase
        .from('reservations')
        .update({ 
          status: 'pending_cancellation' // Nouveau statut pour les demandes d'annulation
        })
        .eq('id', reservationId)
        .select()
        .single()

      if (updateError) throw updateError
      return updatedReservation
    } catch (error) {
      console.error('Erreur demande annulation réservation:', error)
      throw error
    }
  },

  // Vérifier la disponibilité d'une propriété
  async checkAvailability(propertyId: string, checkIn: string, checkOut: string) {
    try {
      // Récupérer toutes les réservations pour cette propriété
      const { data: allReservations, error } = await supabase
        .from('reservations')
        .select('check_in, check_out')
        .eq('property_id', propertyId)
        .in('status', ['confirmed', 'pending'])

      if (error) throw error

      // Vérifier les chevauchements côté client pour plus de fiabilité
      const hasConflict = allReservations?.some(reservation => {
        const resCheckIn = new Date(reservation.check_in)
        const resCheckOut = new Date(reservation.check_out)
        const newCheckIn = new Date(checkIn)
        const newCheckOut = new Date(checkOut)
        
        // Deux périodes se chevauchent si: start1 < end2 AND end1 > start2
        return resCheckIn < newCheckOut && resCheckOut > newCheckIn
      })

      // Si des réservations existent dans cette période, la propriété n'est pas disponible
      return !hasConflict
    } catch (error) {
      console.error('Erreur vérification disponibilité:', error)
      throw error
    }
  },

  // Récupérer les statistiques de réservation pour un propriétaire
  async getOwnerStats(ownerId: string) {
    try {
      const { data: ownerProperties, error: ownerPropsError } = await supabase
        .from('properties')
        .select('id')
        .eq('owner_id', ownerId)

      if (ownerPropsError) throw ownerPropsError

      const propertyIds = ownerProperties?.map(p => p.id) || []
      if (propertyIds.length === 0) {
        return {
          totalReservations: 0,
          totalRevenue: 0,
          pendingReservations: 0,
          confirmedReservations: 0,
          completedReservations: 0,
          cancelledReservations: 0
        }
      }

      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .in('property_id', propertyIds)

      if (error) throw error

      const stats = {
        totalReservations: data.length,
        totalRevenue: data.reduce((sum, res) => sum + Number(res.total_amount || 0), 0),
        pendingReservations: data.filter(res => res.status === 'pending').length,
        confirmedReservations: data.filter(res => res.status === 'confirmed').length,
        completedReservations: data.filter(res => res.status === 'completed').length,
        cancelledReservations: data.filter(res => res.status === 'cancelled').length,
      }

      return stats
    } catch (error) {
      console.error('Erreur récupération statistiques:', error)
      throw error
    }
  },

  // Récupérer une réservation par ID avec détails
  async getReservationById(id: string) {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        // Erreur autre que "row not found"
        throw error
      }

      if (!data) {
        throw new Error('Réservation introuvable')
      }

      const [reservationWithDetails] = await attachReservationDetails([data], {
        includeProperty: true,
        includeGuestProfile: true
      })

      return reservationWithDetails
    } catch (error) {
      console.error('Erreur récupération réservation:', error)
      throw error
    }
  }
}

export default reservationsService

export { attachReservationDetails }