// Script de test pour vérifier la connexion Supabase
// Exécutez avec: node test-supabase-connection.js

import { createClient } from '@supabase/supabase-js';

// Remplacez par vos vraies credentials
const supabaseUrl = 'YOUR_SUPABASE_URL_HERE';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY_HERE';

if (supabaseUrl === 'YOUR_SUPABASE_URL_HERE' || supabaseKey === 'YOUR_SUPABASE_ANON_KEY_HERE') {
  console.log('❌ Veuillez remplacer les credentials dans ce fichier');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('🔄 Test de connexion à Supabase...');
    
    // Test de connexion basique
    const { data, error } = await supabase
      .from('consultation_messages')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Erreur de connexion:', error.message);
      return;
    }
    
    console.log('✅ Connexion réussie !');
    console.log('📊 Table consultation_messages accessible');
    
    // Test d'insertion
    console.log('🔄 Test d\'insertion...');
    const { data: insertData, error: insertError } = await supabase
      .from('consultation_messages')
      .insert([
        {
          first_name: 'Test',
          last_name: 'User',
          email: 'test@example.com',
          phone: '+1234567890',
          subject: 'Test de connexion',
          message: 'Ceci est un test de connexion automatique'
        }
      ])
      .select();
    
    if (insertError) {
      console.log('❌ Erreur d\'insertion:', insertError.message);
      return;
    }
    
    console.log('✅ Insertion réussie !');
    console.log('📝 Message de test créé avec l\'ID:', insertData[0].id);
    
    // Nettoyage du test
    console.log('🔄 Nettoyage du message de test...');
    await supabase
      .from('consultation_messages')
      .delete()
      .eq('id', insertData[0].id);
    
    console.log('✅ Test complet réussi !');
    console.log('🎉 Votre configuration Supabase est prête !');
    
  } catch (error) {
    console.log('❌ Erreur inattendue:', error.message);
  }
}

testConnection();





