import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type Reservation = Database['public']['Tables']['reservations']['Row']
type ReservationInsert = Database['public']['Tables']['reservations']['Insert']
type ReservationUpdate = Database['public']['Tables']['reservations']['Update']

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
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          property:properties(*)
        `)
        .eq('guest_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
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
      // Récupérer les informations de la réservation
      const { data: reservation, error: resError } = await supabase
        .from('reservations')
        .select(`
          *,
          property:properties(*),
          guest:user_profiles(*)
        `)
        .eq('id', reservationId)
        .single()

      if (resError) throw resError

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
            property_id: reservation.property_id,
            guest_id: reservation.guest_id,
            reason: reason || null,
            reservation: reservation
          },
          is_read: false
        }))

        const { error: notifError } = await supabase
          .from('notifications')
          .insert(notifications)

        if (notifError) throw notifError
      }

      // Mettre à jour la réservation avec le statut de demande d'annulation
      const { data: updatedReservation, error: updateError } = await supabase
        .from('reservations')
        .update({ 
          cancellation_reason: reason || 'Demande d\'annulation par le voyageur',
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
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          properties!inner(owner_id)
        `)
        .eq('properties.owner_id', ownerId)

      if (error) throw error

      const stats = {
        totalReservations: data.length,
        totalRevenue: data.reduce((sum, res) => sum + Number(res.total_amount), 0),
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
        .select(`
          *,
          property:properties(*),
          guest:user_profiles(*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erreur récupération réservation:', error)
      throw error
    }
  }
}

export default reservationsService