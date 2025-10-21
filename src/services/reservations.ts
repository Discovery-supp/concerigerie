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
          properties(*),
          users!reservations_guest_id_fkey(*)
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

  // Vérifier la disponibilité d'une propriété
  async checkAvailability(propertyId: string, checkIn: string, checkOut: string) {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('property_id', propertyId)
        .in('status', ['confirmed', 'pending'])
        .or(`check_in.lte.${checkOut},check_out.gte.${checkIn}`)

      if (error) throw error

      // Si des réservations existent dans cette période, la propriété n'est pas disponible
      return data.length === 0
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