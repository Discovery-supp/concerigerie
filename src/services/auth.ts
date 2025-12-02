import { supabase, isSupabaseConfigured } from '../lib/supabase'

export const authService = {
  // Inscription
  async signUp(email: string, password: string, userData: {
    firstName: string
    lastName: string
    phone: string
    userType: string
    dateOfBirth?: string
    country?: string
    city?: string
    address?: string
    postalCode?: string
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

      if (authError) {
        console.error('Erreur Supabase Auth:', authError)
        throw authError
      }

      if (authData.user) {
        // Attendre un peu pour laisser le trigger s'exécuter
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Tenter de récupérer le profil créé par le trigger (plusieurs tentatives)
        let profileData = null
        let attempts = 0
        const maxAttempts = 3
        
        while (!profileData && attempts < maxAttempts) {
          const { data, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', authData.user.id)
            .maybeSingle()
          
          if (data) {
            profileData = data
            break
          }
          
          if (profileError && profileError.code !== 'PGRST116') {
            console.warn('Erreur récupération profil (tentative', attempts + 1, '):', profileError)
          }
          
          attempts++
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 500))
          }
        }

        // Mettre à jour le profil avec les informations supplémentaires si fournies
        const profileUpdateData: any = {
          first_name: userData.firstName || 'Utilisateur',
          last_name: userData.lastName || '',
          phone: userData.phone || null,
          user_type: userData.userType || 'traveler',
          updated_at: new Date().toISOString()
        };

        // Ajouter les champs optionnels s'ils sont fournis
        if (userData.dateOfBirth) profileUpdateData.date_of_birth = userData.dateOfBirth;
        if (userData.country) profileUpdateData.country = userData.country;
        if (userData.city) profileUpdateData.city = userData.city;
        if (userData.address) profileUpdateData.address = userData.address;
        if (userData.postalCode) profileUpdateData.postal_code = userData.postalCode;

        // Si le trigger n'a pas créé le profil, le créer manuellement
        if (!profileData) {
          console.log('Trigger n\'a pas créé le profil, création manuelle...')
          const { data: upserted, error: upsertError } = await supabase
            .from('user_profiles')
            .upsert({
              id: authData.user.id,
              email: authData.user.email || email,
              ...profileUpdateData,
              created_at: new Date().toISOString()
            })
            .select()
            .maybeSingle()

          if (upsertError) {
            console.error('Erreur création manuelle du profil:', upsertError)
            // Retourner quand même l'utilisateur, le profil pourra être créé plus tard
            return { user: authData.user, profile: null }
          }
          profileData = upserted as any
        } else {
          // Mettre à jour le profil existant avec les informations supplémentaires
          const { data: updated, error: updateError } = await supabase
            .from('user_profiles')
            .update(profileUpdateData)
            .eq('id', authData.user.id)
            .select()
            .maybeSingle();

          if (!updateError && updated) {
            profileData = updated;
          }
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
      
      // Gérer spécifiquement les erreurs d'authentification (403, refresh token, JWT)
      if (error) {
        const isAuthError = 
          error.status === 403 || 
          error.message?.includes('Forbidden') ||
          error.message?.includes('Refresh Token') || 
          error.message?.includes('Invalid Refresh Token') ||
          error.message?.includes('JWT') ||
          error.message?.includes('token');
          
        if (isAuthError) {
          console.warn('Erreur d\'authentification détectée, déconnexion automatique...', error)
          // Nettoyer la session
          try {
            localStorage.removeItem('supabase.auth.token')
            await supabase.auth.signOut()
          } catch (signOutError) {
            console.error('Erreur lors de la déconnexion:', signOutError)
            localStorage.removeItem('supabase.auth.token')
          }
          return { user: null, profile: null }
        }
        throw error
      }

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
    } catch (error: any) {
      console.error('Erreur récupération utilisateur:', error)
      
      // Si c'est une erreur de refresh token, nettoyer la session
      if (error?.message?.includes('Refresh Token') || 
          error?.message?.includes('Invalid Refresh Token')) {
        try {
          await supabase.auth.signOut()
        } catch (signOutError) {
          console.error('Erreur lors de la déconnexion:', signOutError)
        }
      }
      
      return { user: null, profile: null }
    }
  }
}

export default authService