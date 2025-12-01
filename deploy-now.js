// Script de déploiement rapide
// Exécutez avec: node deploy-now.js

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Déploiement de Nzoo Immo Conciergerie...\n');

// Vérifier si Git est initialisé
try {
  execSync('git status', { stdio: 'ignore' });
  console.log('✅ Git repository détecté');
} catch (error) {
  console.log('📦 Initialisation du repository Git...');
  execSync('git init', { stdio: 'inherit' });
  execSync('git add .', { stdio: 'inherit' });
  execSync('git commit -m "Initial commit - Nzoo Immo Conciergerie"', { stdio: 'inherit' });
  console.log('✅ Repository Git initialisé');
}

// Créer le fichier .env.production
const envContent = `# Variables d'environnement pour la production
VITE_SUPABASE_URL=https://jqklezcdawgihgnsyrzc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impxa2xlemNkYXdnaWhnbnN5cnpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDQwNjIsImV4cCI6MjA3NTA4MDA2Mn0.at6KrfbJX8_Lj9XCvsJRC5ytGl0HeYU8D1QPhjyI4r0`;

try {
  fs.writeFileSync('.env.production', envContent);
  console.log('✅ Fichier .env.production créé');
} catch (error) {
  console.log('⚠️  Impossible de créer .env.production (peut-être déjà existant)');
}

// Build de l'application
console.log('🔨 Build de l\'application...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build réussi');
} catch (error) {
  console.log('❌ Erreur lors du build');
  process.exit(1);
}

console.log('\n🎯 Prochaines étapes :');
console.log('1. Poussez votre code sur GitHub :');
console.log('   git remote add origin https://github.com/votre-username/nzoo-immo-concerigerie.git');
console.log('   git push -u origin main');
console.log('');
console.log('2. Déployez sur Vercel :');
console.log('   - Allez sur https://vercel.com');
console.log('   - Connectez-vous avec GitHub');
console.log('   - Importez votre repository');
console.log('   - Ajoutez les variables d\'environnement');
console.log('   - Déployez !');
console.log('');
console.log('3. Ou utilisez Netlify :');
console.log('   - Allez sur https://netlify.com');
console.log('   - Connectez votre repository GitHub');
console.log('   - Configurez les variables d\'environnement');
console.log('   - Déployez !');
console.log('');
console.log('📖 Consultez DEPLOYMENT_GUIDE.md pour plus de détails');

