/*
  Script: Supprimer définitivement la dernière propriété "Maison de luxe"
  - Supprime les enregistrements liés (reviews, reservations) puis la propriété
  - Supprime aussi les fichiers d'images associés dans Supabase Storage

  Prérequis:
  1) Variables d'environnement:
     - SUPABASE_URL
     - SUPABASE_SERVICE_ROLE_KEY   (clé service role, pas la clé anonyme)
  2) Adapter BUCKET_NAME si besoin

  Utilisation:
    node scripts/delete-latest-property.js
*/

const { createClient } = require('@supabase/supabase-js')

// CONFIGURE: nom du bucket storage contenant les images
const BUCKET_NAME = process.env.PROPERTIES_BUCKET_NAME || 'public'

function requireEnv(name) {
  const value = process.env[name]
  if (!value) {
    console.error(`Variable d'environnement manquante: ${name}`)
    process.exit(1)
  }
  return value
}

const SUPABASE_URL = requireEnv('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = requireEnv('SUPABASE_SERVICE_ROLE_KEY')

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function main() {
  console.log('Recherche de la dernière propriété "Maison de luxe"...')

  // 1) Trouver la propriété ciblée
  const { data: prop, error: findErr } = await supabase
    .from('properties')
    .select('*')
    .eq('title', 'Maison de luxe')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (findErr) {
    console.error('Erreur recherche propriété:', findErr)
    process.exit(1)
  }

  if (!prop) {
    console.log('Aucune propriété "Maison de luxe" trouvée. Rien à faire.')
    return
  }

  const propertyId = prop.id
  console.log(`Propriété trouvée: id=${propertyId}, title=${prop.title}`)

  // 2) Supprimer les dépendances (si RLS/politiques l'exigent et pas de cascade)
  console.log('Suppression des reviews liées...')
  const { error: revErr } = await supabase
    .from('reviews')
    .delete()
    .eq('property_id', propertyId)
  if (revErr) {
    console.error('Erreur suppression reviews:', revErr)
    // on continue malgré tout
  }

  console.log('Suppression des réservations liées...')
  const { error: resErr } = await supabase
    .from('reservations')
    .delete()
    .eq('property_id', propertyId)
  if (resErr) {
    console.error('Erreur suppression réservations:', resErr)
    // on continue malgré tout
  }

  // 3) Supprimer les images du Storage si présentes
  const imagesField = prop.images
  const imagePaths = normalizeImagePaths(imagesField, SUPABASE_URL, BUCKET_NAME)

  if (imagePaths.length > 0) {
    console.log(`Suppression des fichiers Storage (${imagePaths.length})...`)
    const { error: rmErr } = await supabase.storage.from(BUCKET_NAME).remove(imagePaths)
    if (rmErr) {
      console.error('Erreur suppression fichiers Storage:', rmErr)
    } else {
      console.log('Fichiers Storage supprimés.')
    }
  } else {
    console.log('Aucun fichier Storage à supprimer (champ images vide ou non reconnu).')
  }

  // 4) Supprimer la propriété elle-même
  console.log('Suppression de la propriété...')
  const { error: delErr } = await supabase
    .from('properties')
    .delete()
    .eq('id', propertyId)

  if (delErr) {
    console.error('Erreur suppression propriété:', delErr)
    process.exit(1)
  }

  console.log(`Propriété ${propertyId} supprimée définitivement.`)
}

function normalizeImagePaths(imagesField, supabaseUrl, bucket) {
  if (!imagesField) return []

  // Le champ peut être: array de chemins, array d'URLs, string JSON, string simple
  let items = []
  if (Array.isArray(imagesField)) {
    items = imagesField
  } else if (typeof imagesField === 'string') {
    try {
      const parsed = JSON.parse(imagesField)
      if (Array.isArray(parsed)) items = parsed
      else items = [imagesField]
    } catch (_) {
      items = [imagesField]
    }
  } else {
    return []
  }

  // Convertir toute URL complète en chemin relatif au bucket
  // Exemple d'URL: `${supabaseUrl}/storage/v1/object/public/<bucket>/<path>`
  const prefix = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/` // .../object/
  const bucketPrefix = `${prefix}${bucket}/`

  return items
    .filter(Boolean)
    .map((s) => String(s))
    .map((p) => (p.startsWith(bucketPrefix) ? p.substring(bucketPrefix.length) : p))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})


