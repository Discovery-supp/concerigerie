// Script de test rapide pour vérifier que l'application fonctionne
// Exécutez avec: node test-app-functionality.js

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

console.log('🧪 Test de fonctionnalité de l\'application Nzoo Immo\n');

// Vérifier que les fichiers principaux existent
const requiredFiles = [
    'src/App.tsx',
    'src/pages/DashboardPage.tsx',
    'src/components/Dashboard/HostDashboard.tsx',
    'src/components/Dashboard/AdminDashboard.tsx',
    'src/components/Dashboard/TravelerDashboard.tsx',
    'src/components/Dashboard/ProviderDashboard.tsx',
    'src/components/Notifications/NotificationSystem.tsx',
    'src/components/Analytics/AnalyticsDashboard.tsx',
    'src/pages/AnalyticsPage.tsx'
];

console.log('📁 Vérification des fichiers...');
let allFilesExist = true;

requiredFiles.forEach(file => {
    if (existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - MANQUANT`);
        allFilesExist = false;
    }
});

// Vérifier que les composants importent correctement
console.log('\n🔍 Vérification des imports...');

try {
    const appContent = readFileSync('src/App.tsx', 'utf8');
    
    // Vérifier les imports des pages
    const requiredImports = [
        'DashboardPage',
        'PropertyManagementPage',
        'ReservationManagementPage',
        'MessagingPage',
        'ReviewsPage',
        'AnalyticsPage'
    ];
    
    requiredImports.forEach(importName => {
        if (appContent.includes(importName)) {
            console.log(`✅ Import ${importName}`);
        } else {
            console.log(`❌ Import ${importName} - MANQUANT`);
            allFilesExist = false;
        }
    });
    
    // Vérifier les routes
    const requiredRoutes = [
        '/dashboard',
        '/properties',
        '/reservations',
        '/messaging',
        '/reviews',
        '/analytics'
    ];
    
    console.log('\n🛣️ Vérification des routes...');
    requiredRoutes.forEach(route => {
        if (appContent.includes(`path="${route}"`)) {
            console.log(`✅ Route ${route}`);
        } else {
            console.log(`❌ Route ${route} - MANQUANT`);
            allFilesExist = false;
        }
    });
    
} catch (error) {
    console.log(`❌ Erreur lors de la lecture d'App.tsx: ${error.message}`);
    allFilesExist = false;
}

// Vérifier les composants de tableau de bord
console.log('\n📊 Vérification des composants de tableau de bord...');

const dashboardComponents = [
    'src/components/Dashboard/HostDashboard.tsx',
    'src/components/Dashboard/AdminDashboard.tsx',
    'src/components/Dashboard/TravelerDashboard.tsx',
    'src/components/Dashboard/ProviderDashboard.tsx'
];

dashboardComponents.forEach(component => {
    if (existsSync(component)) {
        try {
            const content = readFileSync(component, 'utf8');
            if (content.includes('export default')) {
                console.log(`✅ ${component} - Exporté correctement`);
            } else {
                console.log(`❌ ${component} - Pas d'export par défaut`);
                allFilesExist = false;
            }
        } catch (error) {
            console.log(`❌ ${component} - Erreur de lecture`);
            allFilesExist = false;
        }
    }
});

// Vérifier le système de notifications
console.log('\n🔔 Vérification du système de notifications...');

if (existsSync('src/components/Notifications/NotificationSystem.tsx')) {
    try {
        const content = readFileSync('src/components/Notifications/NotificationSystem.tsx', 'utf8');
        if (content.includes('export default')) {
            console.log('✅ NotificationSystem - Exporté correctement');
        } else {
            console.log('❌ NotificationSystem - Pas d\'export par défaut');
            allFilesExist = false;
        }
    } catch (error) {
        console.log('❌ NotificationSystem - Erreur de lecture');
        allFilesExist = false;
    }
} else {
    console.log('❌ NotificationSystem - Fichier manquant');
    allFilesExist = false;
}

// Vérifier les analytics
console.log('\n📈 Vérification des analytics...');

if (existsSync('src/components/Analytics/AnalyticsDashboard.tsx')) {
    try {
        const content = readFileSync('src/components/Analytics/AnalyticsDashboard.tsx', 'utf8');
        if (content.includes('export default')) {
            console.log('✅ AnalyticsDashboard - Exporté correctement');
        } else {
            console.log('❌ AnalyticsDashboard - Pas d\'export par défaut');
            allFilesExist = false;
        }
    } catch (error) {
        console.log('❌ AnalyticsDashboard - Erreur de lecture');
        allFilesExist = false;
    }
} else {
    console.log('❌ AnalyticsDashboard - Fichier manquant');
    allFilesExist = false;
}

// Résumé
console.log('\n📋 RÉSUMÉ DU TEST');
console.log('==================');

if (allFilesExist) {
    console.log('✅ Tous les fichiers et composants sont présents');
    console.log('✅ L\'application devrait fonctionner correctement');
    console.log('\n🎯 PROCHAINES ÉTAPES:');
    console.log('1. Exécutez le script test-accounts-simple.sql dans Supabase');
    console.log('2. Vérifiez avec verify-test-data.sql');
    console.log('3. Testez l\'application avec les comptes de test');
    console.log('4. Explorez tous les tableaux de bord spécialisés');
} else {
    console.log('❌ Certains fichiers ou composants sont manquants');
    console.log('❌ L\'application pourrait ne pas fonctionner correctement');
    console.log('\n🔧 ACTIONS REQUISES:');
    console.log('1. Vérifiez que tous les fichiers ont été créés');
    console.log('2. Relancez la création des composants manquants');
    console.log('3. Vérifiez les imports et exports');
}

console.log('\n🚀 Pour démarrer l\'application:');
console.log('npm run dev');
console.log('\n📚 Pour plus d\'informations, consultez TEST_ACCOUNTS_GUIDE.md');
