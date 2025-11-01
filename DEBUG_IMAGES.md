# Guide de Débogage - Problème d'Images

## Vérifications à faire

### 1. Vérifier que les images sont bien sauvegardées

Dans la console du navigateur (F12), après la création d'une annonce, vous devriez voir :
- `Images à sauvegarder: [...]` - Liste des URLs des images
- `Nombre d'images: X` - Nombre d'images
- `Propriété créée: {...}` - Les données de la propriété créée
- `Images sauvegardées: [...]` - Les images retournées par Supabase

### 2. Vérifier dans Supabase

Exécutez cette requête SQL dans Supabase :

```sql
SELECT 
  id,
  title,
  images,
  jsonb_typeof(images) as images_type,
  jsonb_array_length(images::jsonb) as images_count
FROM properties
ORDER BY created_at DESC
LIMIT 5;
```

Cela vous montrera :
- Si les images sont bien sauvegardées
- Le type de données (devrait être jsonb)
- Le nombre d'images

### 3. Formats d'images supportés

Les images peuvent être dans ces formats :
- **URL Supabase Storage** : `https://xxx.supabase.co/storage/v1/object/public/property-images/...`
- **Base64** : `data:image/jpeg;base64,/9j/4AAQSkZJRg...` (si Supabase Storage n'est pas configuré)
- **URL externe** : `https://example.com/image.jpg`

### 4. Problèmes courants

**Problème** : Les images ne s'affichent pas
- **Solution** : Vérifiez la console pour voir les erreurs de chargement d'images
- **Solution** : Vérifiez que les URLs sont valides
- **Solution** : Si c'est base64, vérifiez que la chaîne n'est pas tronquée

**Problème** : Images par défaut affichées
- **Cause** : Le tableau `images` est vide ou null dans la base
- **Solution** : Vérifiez que les images sont bien uploadées avant de créer l'annonce

**Problème** : Images en base64 mais pas affichées
- **Cause** : Les chaînes base64 peuvent être très longues
- **Solution** : Configurez Supabase Storage pour utiliser des URLs au lieu de base64

## Commandes SQL utiles

### Vérifier les images d'une propriété spécifique

```sql
SELECT 
  id,
  title,
  images,
  CASE 
    WHEN jsonb_typeof(images) = 'array' THEN jsonb_array_length(images)
    ELSE 0
  END as images_count
FROM properties
WHERE id = 'VOTRE_PROPERTY_ID';
```

### Voir les premières images d'une propriété

```sql
SELECT 
  id,
  title,
  jsonb_array_elements_text(images::jsonb) as image_url
FROM properties
WHERE id = 'VOTRE_PROPERTY_ID'
LIMIT 5;
```

### Mettre à jour les images si nécessaire

```sql
UPDATE properties
SET images = '["https://url-image-1.jpg", "https://url-image-2.jpg"]'::jsonb
WHERE id = 'VOTRE_PROPERTY_ID';
```

