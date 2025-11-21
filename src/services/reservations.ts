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

      // Trouver tous les admins en utilisant la fonction SQL qui bypass RLS
      // Cette approche garantit que tous les admins sont trouvés même avec RLS activé
      let adminIds: string[] = []
      
      try {
        // Essayer d'abord avec la fonction SQL (plus fiable)
        const { data: adminData, error: functionError } = await supabase
          .rpc('get_all_admin_ids')

        if (!functionError && adminData && adminData.length > 0) {
          adminIds = adminData.map((admin: any) => admin.admin_id)
          console.log('[requestCancellation] Admins trouvés via fonction SQL:', adminIds.length)
        } else {
          // Fallback: essayer la requête directe
          console.warn('[requestCancellation] Fonction SQL échouée, tentative requête directe:', functionError)
          const { data: admins, error: adminError } = await supabase
            .from('user_profiles')
            .select('id')
            .in('user_type', ['admin', 'super_admin'])

          if (adminError) {
            console.error('[requestCancellation] Erreur récupération admins:', adminError)
            // Ne pas bloquer la demande d'annulation si on ne peut pas trouver les admins
            // On continuera quand même pour mettre à jour le statut de la réservation
          } else if (admins && admins.length > 0) {
            adminIds = admins.map(admin => admin.id)
            console.log('[requestCancellation] Admins trouvés via requête directe:', adminIds.length)
          }
        }
      } catch (error: any) {
        console.error('[requestCancellation] Erreur lors de la récupération des admins:', error)
        // Continuer même si on ne peut pas trouver les admins
      }

      // Créer une notification pour chaque admin
      if (adminIds.length > 0) {
        const notifications = adminIds.map(adminId => ({
          user_id: adminId,
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

        if (notifError) {
          console.error('[requestCancellation] Erreur création notifications:', notifError)
          // Ne pas bloquer la demande d'annulation si les notifications échouent
          // Le statut de la réservation sera quand même mis à jour
        } else {
          console.log('[requestCancellation] Notifications créées pour', adminIds.length, 'admin(s)')
        }
      } else {
        console.warn('[requestCancellation] Aucun admin trouvé pour envoyer les notifications')
        // Log pour diagnostic
        console.warn('[requestCancellation] La demande d\'annulation sera créée mais aucun admin ne recevra de notification')
      }

      // Mettre à jour la réservation avec le statut de demande d'annulation
      // Préparer les données de mise à jour
      const updateData: any = {
        status: 'pending_cancellation' // Nouveau statut pour les demandes d'annulation
      }

      // Ajouter la raison d'annulation si elle existe dans le schéma
      // On essaie d'abord avec cancellation_reason, sinon on ignore silencieusement
      if (reason) {
        try {
          // Vérifier si la colonne existe en essayant de la mettre à jour
          updateData.cancellation_reason = reason
        } catch (e) {
          console.warn('[requestCancellation] Colonne cancellation_reason non disponible, raison non sauvegardée')
        }
      }

      console.log('[requestCancellation] Mise à jour réservation:', reservationId, 'avec statut:', 'pending_cancellation')
      
      const { data: updatedReservation, error: updateError } = await supabase
        .from('reservations')
        .update(updateData)
        .eq('id', reservationId)
        .select()
        .single()

      if (updateError) {
        console.error('[requestCancellation] Erreur mise à jour réservation:', updateError)
        throw updateError
      }

      if (!updatedReservation) {
        throw new Error('La réservation n\'a pas pu être mise à jour')
      }

      console.log('[requestCancellation] Réservation mise à jour avec succès:', updatedReservation.id, 'Statut:', updatedReservation.status)
      
      // Vérifier que le statut a bien été mis à jour
      if (updatedReservation.status !== 'pending_cancellation') {
        console.error('[requestCancellation] ATTENTION: Le statut n\'a pas été correctement mis à jour. Statut actuel:', updatedReservation.status)
        throw new Error(`Le statut n'a pas été correctement mis à jour. Statut actuel: ${updatedReservation.status}`)
      }

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
  },

  // Valider une demande d'annulation (admin)
  async approveCancellation(reservationId: string, adminId: string) {
    try {
      // Récupérer la réservation
      const { data: reservation, error: resError } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', reservationId)
        .single()

      if (resError) throw resError

      if (reservation.status !== 'pending_cancellation') {
        throw new Error('Cette réservation n\'a pas de demande d\'annulation en attente')
      }

      // Mettre à jour la réservation
      const { data: updatedReservation, error: updateError } = await supabase
        .from('reservations')
        .update({
          status: 'cancelled',
          payment_status: 'refunded',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', reservationId)
        .select()
        .single()

      if (updateError) throw updateError

      // Charger les détails pour la notification
      const [reservationWithData] = await attachReservationDetails([updatedReservation], {
        includeProperty: true,
        includeGuestProfile: true
      })

      // Créer une notification pour le voyageur
      if (reservationWithData.guest_id) {
        const { error: notifError } = await supabase
          .from('notifications')
          .insert({
            user_id: reservationWithData.guest_id,
            type: 'cancellation_approved',
            title: 'Annulation approuvée',
            message: `Votre demande d'annulation pour la réservation #${reservationId.substring(0, 8)} a été approuvée. Le remboursement sera effectué sous peu.`,
            data: {
              reservation_id: reservationId,
              property_id: reservationWithData.property_id
            },
            is_read: false
          })

        if (notifError) console.warn('Erreur création notification:', notifError)
      }

      return updatedReservation
    } catch (error) {
      console.error('Erreur validation annulation:', error)
      throw error
    }
  },

  // Rejeter une demande d'annulation (admin)
  async rejectCancellation(reservationId: string, adminId: string, reason?: string) {
    try {
      // Récupérer la réservation
      const { data: reservation, error: resError } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', reservationId)
        .single()

      if (resError) throw resError

      if (reservation.status !== 'pending_cancellation') {
        throw new Error('Cette réservation n\'a pas de demande d\'annulation en attente')
      }

      // Restaurer le statut précédent (confirmed ou pending)
      const previousStatus = reservation.payment_status === 'paid' ? 'confirmed' : 'pending'
      
      const { data: updatedReservation, error: updateError } = await supabase
        .from('reservations')
        .update({
          status: previousStatus,
          cancellation_reason: null
        })
        .eq('id', reservationId)
        .select()
        .single()

      if (updateError) throw updateError

      // Charger les détails pour la notification
      const [reservationWithData] = await attachReservationDetails([updatedReservation], {
        includeProperty: true,
        includeGuestProfile: true
      })

      // Créer une notification pour le voyageur
      if (reservationWithData.guest_id) {
        const { error: notifError } = await supabase
          .from('notifications')
          .insert({
            user_id: reservationWithData.guest_id,
            type: 'cancellation_rejected',
            title: 'Demande d\'annulation refusée',
            message: `Votre demande d'annulation pour la réservation #${reservationId.substring(0, 8)} a été refusée.${reason ? ` Raison: ${reason}` : ''}`,
            data: {
              reservation_id: reservationId,
              property_id: reservationWithData.property_id,
              reason: reason || null
            },
            is_read: false
          })

        if (notifError) console.warn('Erreur création notification:', notifError)
      }

      return updatedReservation
    } catch (error) {
      console.error('Erreur rejet annulation:', error)
      throw error
    }
  },

  // Nettoyer automatiquement les réservations expirées
  // Supprime les réservations qui ne sont pas confirmées OU en statut "payer" après la date de fin
  async cleanupExpiredReservations() {
    try {
      const today = new Date().toISOString().split('T')[0]

      // Récupérer toutes les réservations expirées (check_out < aujourd'hui)
      const { data: expiredReservations, error: fetchError } = await supabase
        .from('reservations')
        .select('id, status, payment_status, check_out')
        .lt('check_out', today)

      if (fetchError) throw fetchError

      if (!expiredReservations || expiredReservations.length === 0) {
        return { deleted: 0, message: 'Aucune réservation expirée à supprimer' }
      }

      // Filtrer pour ne garder que celles qui doivent être supprimées:
      // - Non confirmées (status != 'confirmed')
      // - OU en statut "payer" (payment_status = 'paid') même si confirmées
      const toDelete = expiredReservations.filter(r => 
        r.status !== 'confirmed' || r.payment_status === 'paid'
      )

      if (toDelete.length === 0) {
        return { deleted: 0, message: 'Aucune réservation expirée à supprimer' }
      }

      const reservationIds = toDelete.map(r => r.id)

      // Supprimer les réservations
      const { error: deleteError } = await supabase
        .from('reservations')
        .delete()
        .in('id', reservationIds)

      if (deleteError) throw deleteError

      return {
        deleted: reservationIds.length,
        message: `${reservationIds.length} réservation(s) expirée(s) supprimée(s)`
      }
    } catch (error) {
      console.error('Erreur nettoyage réservations expirées:', error)
      throw error
    }
  }
}

export default reservationsService

export { attachReservationDetails }