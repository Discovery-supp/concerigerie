# N'zoo Immo - Plateforme Immobilière

Une plateforme immobilière moderne construite avec React, TypeScript et Supabase.

## 🚀 Déploiement sur Netlify

### Configuration requise

1. **Variables d'environnement** à configurer dans Netlify :
   - `VITE_SUPABASE_URL` : URL de votre projet Supabase
   - `VITE_SUPABASE_ANON_KEY` : Clé anonyme de votre projet Supabase

2. **Configuration Netlify** :
   - Build command : `npm ci && npm run build`
   - Publish directory : `dist`
   - Node version : `18`

### Instructions de déploiement

1. Connectez votre repository GitHub à Netlify
2. Configurez les variables d'environnement dans Netlify Dashboard
3. Le déploiement se fera automatiquement

## 🛠️ Développement local

```bash
# Installation des dépendances
npm install

# Démarrage du serveur de développement
npm run dev

# Build de production
npm run build
```

## 📁 Structure du projet

- `src/` - Code source React/TypeScript
- `supabase/` - Migrations et configuration Supabase
- `public/` - Assets statiques
- `dist/` - Build de production (généré automatiquement)

## 🔧 Technologies utilisées

- **Frontend** : React 18, TypeScript, Vite
- **Styling** : Tailwind CSS
- **Backend** : Supabase
- **Déploiement** : Netlify
