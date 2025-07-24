import { serve } from 'bun';
import app from './real-backend';

const port = 3001;

console.log('🔄 Démarrage du backend SQLite complet...');

const server = serve({
  port,
  fetch: app.fetch,
});

console.log(`✅ Serveur backend démarré sur http://localhost:${port}`);
console.log('📊 Base de données SQLite: ensam_stages.db');
console.log('👤 Admin par défaut: admin@ensam.ac.ma / AdminENSAM2024!');
console.log('📁 Routes disponibles:');
console.log('   • POST /api/auth/login');
console.log('   • POST /api/auth/register');
console.log('   • GET  /api/admin/students');
console.log('   • POST /api/admin/import');
console.log('   • GET  /api/admin/export');
console.log('   • GET  /api/student/profile');
console.log('   • GET  /api/student/conventions');
console.log('');
console.log('📝 Pour tester l\'import:');
console.log('   1. Se connecter comme admin');
console.log('   2. Aller dans Gestion Étudiants');
console.log('   3. Utiliser le bouton "Importer"');