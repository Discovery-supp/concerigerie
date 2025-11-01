// Edge Function pour créer des comptes admin de manière sécurisée
// Cette fonction utilise la clé SERVICE_ROLE_KEY côté serveur (jamais exposée au client)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Gérer les requêtes OPTIONS pour CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Récupérer le token d'authentification de l'utilisateur
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization header manquant')
    }

    // Créer un client Supabase pour vérifier l'utilisateur
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader }
      }
    })

    // Vérifier que l'utilisateur est authentifié et est un super_admin
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      throw new Error('Utilisateur non authentifié')
    }

    // Vérifier que l'utilisateur est super_admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.user_type !== 'super_admin') {
      throw new Error('Seuls les super administrateurs peuvent créer des comptes admin')
    }

    // Récupérer les données de la requête
    const { email, password, first_name, last_name, phone } = await req.json()

    if (!email || !password || !first_name || !last_name) {
      throw new Error('Tous les champs requis doivent être remplis')
    }

    // Créer un client admin avec SERVICE_ROLE_KEY (jamais exposée au client)
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Créer l'utilisateur dans auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirmer l'email pour les admins
      user_metadata: {
        first_name,
        last_name,
        phone
      }
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('Erreur lors de la création du compte auth')

    // Créer le profil dans user_profiles avec user_type = 'admin'
    const { error: profileInsertError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email,
        first_name,
        last_name,
        phone: phone || null,
        user_type: 'admin'
      })

    if (profileInsertError) {
      // Si le profil échoue, supprimer le compte auth pour éviter les orphelins
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw profileInsertError
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: authData.user.id,
          email: authData.user.email
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error: any) {
    console.error('Erreur création compte admin:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Une erreur est survenue lors de la création du compte admin'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})

