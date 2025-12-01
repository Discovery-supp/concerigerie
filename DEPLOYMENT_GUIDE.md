# 🚀 Guide de Déploiement - Nzoo Immo Conciergerie

## Option 1 : Vercel (Recommandé)

### Prérequis
- Compte GitHub
- Compte Vercel (gratuit)

### Étapes

1. **Poussez votre code sur GitHub** :
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/votre-username/nzoo-immo-concerigerie.git
   git push -u origin main
   ```

2. **Connectez-vous à Vercel** :
   - Allez sur [vercel.com](https://vercel.com)
   - Connectez-vous avec GitHub
   - Cliquez sur "New Project"

3. **Importez votre projet** :
   - Sélectionnez votre repository GitHub
   - Vercel détectera automatiquement que c'est un projet Vite
   - Cliquez sur "Deploy"

4. **Configurez les variables d'environnement** :
   - Dans les paramètres du projet Vercel
   - Allez dans "Environment Variables"
   - Ajoutez :
     - `VITE_SUPABASE_URL` = `https://jqklezcdawgihgnsyrzc.supabase.co`
     - `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impxa2xlemNkYXdnaWhnbnN5cnpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDQwNjIsImV4cCI6MjA3NTA4MDA2Mn0.at6KrfbJX8_Lj9XCvsJRC5ytGl0HeYU8D1QPhjyI4r0`

5. **Redéployez** :
   - Cliquez sur "Redeploy" après avoir ajouté les variables

## Option 2 : Netlify

### Étapes

1. **Poussez votre code sur GitHub** (même étapes que Vercel)

2. **Connectez-vous à Netlify** :
   - Allez sur [netlify.com](https://netlify.com)
   - Connectez-vous avec GitHub
   - Cliquez sur "New site from Git"

3. **Configurez le build** :
   - Build command : `npm run build`
   - Publish directory : `dist`

4. **Ajoutez les variables d'environnement** :
   - Dans "Site settings" > "Environment variables"
   - Ajoutez les mêmes variables que pour Vercel

## Option 3 : GitHub Pages

### Étapes

1. **Installez gh-pages** :
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Ajoutez le script dans package.json** :
   ```json
   {
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     }
   }
   ```

3. **Déployez** :
   ```bash
   npm run deploy
   ```

## Option 4 : Surge.sh (Rapide)

### Étapes

1. **Installez Surge** :
   ```bash
   npm install -g surge
   ```

2. **Build et déployez** :
   ```bash
   npm run build
   cd dist
   surge
   ```

## 🔧 Configuration importante

### Variables d'environnement à configurer
- `VITE_SUPABASE_URL` : URL de votre projet Supabase
- `VITE_SUPABASE_ANON_KEY` : Clé API publique de Supabase

### URLs de test
- Page d'accueil : `https://votre-app.vercel.app/`
- Consultation : `https://votre-app.vercel.app/consultation`
- Services : `https://votre-app.vercel.app/services`
- Devenir hôte : `https://votre-app.vercel.app/become-host`

## ✅ Vérification après déploiement

1. **Testez la page d'accueil**
2. **Testez le formulaire de consultation**
3. **Vérifiez que les messages s'enregistrent dans Supabase**
4. **Testez la navigation entre les pages**

## 🎯 Recommandation

**Vercel** est la meilleure option car :
- ✅ Déploiement automatique depuis GitHub
- ✅ Variables d'environnement faciles à configurer
- ✅ HTTPS automatique
- ✅ CDN global
- ✅ Gratuit pour les projets personnels





