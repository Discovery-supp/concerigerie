# Configuration du Stockage d'Images Supabase

## 📋 Étapes pour Activer l'Upload de Photos

### Option 1 : Via l'Éditeur SQL de Supabase (Recommandé)

1. **Connectez-vous au Dashboard Supabase**
   - Allez sur [supabase.com](https://supabase.com)
   - Sélectionnez votre projet

2. **Exécutez la Migration SQL**
   - Allez dans **SQL Editor**
   - Copiez le contenu du fichier `supabase/migrations/20250117000001_create_property_images_storage.sql`
   - Collez-le dans l'éditeur
   - Cliquez sur **Run**

3. **Vérifiez le Bucket**
   - Allez dans **Storage** dans le menu de gauche
   - Vous devriez voir le bucket `property-images` créé

### Option 2 : Via l'Interface Supabase

1. **Allez dans Storage**
   - Dashboard Supabase → **Storage**

2. **Créer un nouveau bucket**
   - Cliquez sur **New bucket**
   - Nom : `property-images`
   - Public : ✅ **Oui** (pour que les images soient accessibles publiquement)
   - File size limit : `10MB` (ou plus selon vos besoins)
   - Cliquez sur **Create bucket**

3. **Configurer les Politiques RLS**

Allez dans **Storage** → `property-images` → **Policies** et créez ces politiques :

#### Politique d'Upload (INSERT)
```sql
CREATE POLICY "Users can upload property images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Politique de Lecture (SELECT)
```sql
CREATE POLICY "Public can view property images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'property-images');
```

#### Politique de Suppression (DELETE)
```sql
CREATE POLICY "Users can delete their own property images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

## ✅ Vérification

Après la configuration, testez l'upload :

1. Allez dans votre formulaire d'annonce
2. Naviguez jusqu'à l'**Étape 4 : Photos**
3. Essayez de :
   - Cliquer pour sélectionner des images
   - Glisser-déposer des images
4. Les images devraient s'afficher dans la grille de prévisualisation

## 🐛 Dépannage

**Erreur : "Bucket not found"**
- Solution : Vérifiez que le bucket `property-images` existe dans Supabase Storage
- Vérifiez que la migration SQL a été exécutée

**Erreur : "Permission denied"**
- Solution : Vérifiez que les politiques RLS sont bien créées
- Vérifiez que vous êtes authentifié

**Les images ne s'affichent pas après upload**
- Solution : Vérifiez que le bucket est public
- Vérifiez les URLs générées dans la console du navigateur

**Alternative : Mode Base64 (Temporaire)**
Si Supabase Storage n'est pas configuré, le système utilise automatiquement base64 comme fallback.
Les images seront stockées directement dans la base de données (attention : moins efficace pour les grandes images).

## 📝 Notes

- Les images sont stockées dans le dossier `properties/{user_id}/` pour l'isolation
- La limite de taille est de 10MB par image
- Maximum 8 photos par propriété
- Formats acceptés : JPG, PNG

