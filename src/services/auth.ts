import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type User = Database['public']['Tables']['user_profiles']['Row']

export const authService = {
  // Inscription
  async signUp(email: string, password: string, userData: {
    firstName: string
    lastName: string
    phone: string
    userType: string
  }) {
    try {
      // Créer l'utilisateur dans Supabase Auth
      // Le trigger database créera automatiquement le profil
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            firstName: userData.firstName,
            lastName: userData.lastName,
            phone: userData.phone,
            userType: userData.userType,
          }
        }
      })

      if (authError) throw authError

      if (authData.user) {
        // Le trigger DB crée le profil; récupérer le profil
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle()

        if (profileError) {
          // Si le profil n'est pas immédiatement disponible, retourner juste l'user
          return { user: authData.user, profile: null }
        }

        return { user: authData.user, profile: profileData }
      }

      return null
    } catch (error) {
      console.error('Erreur inscription:', error)
      throw error
    }
  },

  // Connexion
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Récupérer le profil utilisateur
      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle()

        if (profileError) throw profileError

        return { user: data.user, profile }
      }
    } catch (error) {
      console.error('Erreur connexion:', error)
      throw error
    }
  },

  // Connexion OAuth
  async signInWithOAuth(provider: 'google' | 'facebook' | 'apple') {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error
      return data
    } catch (error) {
      console.error(`Erreur connexion ${provider}:`, error)
      throw error
    }
  },

  // Déconnexion
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Erreur déconnexion:', error)
      throw error
    }
  },

  // Obtenir l'utilisateur actuel
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) throw error

      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        if (profileError) throw profileError

        return { user, profile }
      }

      return { user: null, profile: null }
    } catch (error) {
      console.error('Erreur récupération utilisateur:', error)
      return { user: null, profile: null }
    }
  }
}

export default authService