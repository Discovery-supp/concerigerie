import { supabase, isSupabaseConfigured } from '../lib/supabase'
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
    if (!isSupabaseConfigured) {
      throw new Error('Supabase n\'est pas configuré. Veuillez configurer les variables d\'environnement.')
    }
    
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
    if (!isSupabaseConfigured) {
      throw new Error('Supabase n\'est pas configuré. Veuillez configurer les variables d\'environnement.')
    }
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Messages d'erreur plus explicites
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Email ou mot de passe incorrect.')
        }
        if (error.message.includes('Email not confirmed')) {
          throw new Error('Veuillez confirmer votre adresse email avant de vous connecter.')
        }
        throw error
      }

      // Récupérer le profil utilisateur (peut être null si pas encore créé)
      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle()

        // Ne pas lancer d'erreur si le profil n'existe pas encore
        // Le profil peut être créé plus tard
        if (profileError && profileError.code !== 'PGRST116') {
          console.warn('Erreur récupération profil:', profileError)
        }

        return { user: data.user, profile: profile || null }
      }

      return { user: null, profile: null }
    } catch (error: any) {
      console.error('Erreur connexion:', error)
      throw error
    }
  },

  // Connexion OAuth
  async signInWithOAuth(provider: 'google' | 'facebook' | 'apple') {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase n\'est pas configuré. Veuillez configurer les variables d\'environnement.')
    }
    
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
    if (!isSupabaseConfigured) {
      return
    }
    
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
    if (!isSupabaseConfigured) {
      return { user: null, profile: null }
    }
    
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