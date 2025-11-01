/**
 * Client Supabase Admin
 * 
 * Ce client utilise la clé service_role pour permettre les opérations admin
 * comme la création de comptes utilisateurs.
 * 
 * ⚠️ IMPORTANT: Cette clé ne doit JAMAIS être exposée côté client dans une application en production.
 * Pour la production, créez une Edge Function Supabase qui utilise cette clé.
 * 
 * Configuration:
 * Ajoutez VITE_SUPABASE_SERVICE_ROLE_KEY dans votre fichier .env (en développement uniquement)
 */

import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Vérifier si la clé service_role est disponible
export const isServiceRoleAvailable = !!(supabaseServiceRoleKey && 
  supabaseServiceRoleKey !== 'placeholder-service-key' &&
  supabaseServiceRoleKey.length > 0);

// Créer un client admin uniquement si la clé est disponible
// En production, utilisez une Edge Function au lieu de cette approche
export const supabaseAdmin = isServiceRoleAvailable && supabaseUrl
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Fonction helper pour créer un compte admin
// Essaie d'abord l'Edge Function (recommandé), puis fallback sur client admin direct
export const createAdminAccount = async (userData: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
}) => {
  // Essayer d'abord via Edge Function (plus sécurisé)
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const response = await fetch(`${supabaseUrl}/functions/v1/create-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || ''
        },
        body: JSON.stringify(userData)
      });

      const result = await response.json();
      
      if (result.success) {
        return result;
      } else {
        throw new Error(result.error || 'Erreur lors de la création via Edge Function');
      }
    }
  } catch (edgeError) {
    console.warn('Edge Function non disponible, tentative avec client admin direct:', edgeError);
    // Continuer avec le fallback...
  }

  // Fallback: utiliser client admin direct (uniquement si Edge Function échoue)
  if (!supabaseAdmin) {
    throw new Error(
      'Impossible de créer le compte admin. ' +
      'Solutions:\n' +
      '1. Déployez l\'Edge Function Supabase: supabase/functions/create-admin/index.ts\n' +
      '2. OU ajoutez VITE_SUPABASE_SERVICE_ROLE_KEY dans votre .env (développement uniquement, NON RECOMMANDÉ en production)'
    );
  }

  try {
    // Créer l'utilisateur dans auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone: userData.phone
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Erreur lors de la création du compte auth');

    // Créer le profil dans user_profiles
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone: userData.phone || null,
        user_type: 'admin'
      });

    if (profileError) {
      // Si le profil échoue, supprimer le compte auth pour éviter les orphelins
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw profileError;
    }

    return {
      user: authData.user,
      profile: {
        id: authData.user.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        user_type: 'admin'
      }
    };
  } catch (error: any) {
    console.error('Erreur création compte admin:', error);
    throw error;
  }
};

