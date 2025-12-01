/*
  # Création du bucket de stockage pour les images de propriétés
  
  Cette migration crée le bucket 'property-images' dans Supabase Storage
  avec les politiques RLS appropriées pour permettre l'upload d'images.
*/

-- Créer le bucket si il n'existe pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- Politique pour permettre l'upload aux utilisateurs authentifiés
CREATE POLICY "Users can upload property images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique pour permettre la lecture publique des images
CREATE POLICY "Public can view property images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'property-images');

-- Politique pour permettre la suppression par le propriétaire
CREATE POLICY "Users can delete their own property images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Commentaire pour documentation
COMMENT ON POLICY "Users can upload property images" ON storage.objects IS 
'Permet aux utilisateurs authentifiés d\'uploader des images dans leur dossier personnel du bucket property-images';

COMMENT ON POLICY "Public can view property images" ON storage.objects IS 
'Permet à tous de voir les images de propriétés (bucket public)';

COMMENT ON POLICY "Users can delete their own property images" ON storage.objects IS 
'Permet aux utilisateurs de supprimer leurs propres images uploadées';

