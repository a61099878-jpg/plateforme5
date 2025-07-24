const { Hono } = require('hono');
const { serve } = require('@hono/node-server');
const { cors } = require('hono/cors');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const app = new Hono();

// Initialize SQLite database
const db = new Database('./ensam_stages.db');

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    nom TEXT NOT NULL,
    telephone TEXT,
    filiere TEXT NOT NULL,
    annee INTEGER NOT NULL,
    code_apogee TEXT UNIQUE NOT NULL,
    cne TEXT UNIQUE NOT NULL,
    cin TEXT UNIQUE NOT NULL,
    date_naissance TEXT NOT NULL,
    is_registered BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS conventions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER REFERENCES students(id),
    type_stage TEXT NOT NULL,
    file_path TEXT,
    file_name TEXT,
    status TEXT DEFAULT 'en_attente',
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    submitted_at DATETIME,
    validated_at DATETIME,
    rejected_at DATETIME,
    admin_notes TEXT
  );
`);

// Create default admin if doesn't exist
const existingAdmin = db.prepare('SELECT * FROM admins WHERE email = ?').get('admin@ensam.ac.ma');
if (!existingAdmin) {
  const hashedPassword = bcrypt.hashSync('AdminENSAM2024!', 10);
  db.prepare('INSERT INTO admins (email, password, name) VALUES (?, ?, ?)').run(
    'admin@ensam.ac.ma', 
    hashedPassword, 
    'Administrateur ENSAM'
  );
  console.log('✅ Admin par défaut créé: admin@ensam.ac.ma / AdminENSAM2024!');
}

// Middleware
app.use('*', cors());

// JWT Mock (simplified for testing)
function generateToken(user) {
  return `${user.role}-${user.id}-${Date.now()}`;
}

function verifyToken(token) {
  if (!token) return null;
  const parts = token.split('-');
  if (parts.length !== 3) return null;
  
  const role = parts[0];
  const id = parseInt(parts[1]);
  
  if (role === 'admin') {
    const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(id);
    return admin ? { id: admin.id, email: admin.email, name: admin.name, role: 'admin' } : null;
  } else if (role === 'student') {
    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
    return student ? { id: student.id, email: student.email, name: student.nom, role: 'student' } : null;
  }
  
  return null;
}

// Auth middleware
const authMiddleware = async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  const user = verifyToken(token || '');
  if (!user) {
    return c.json({ error: 'Non autorisé' }, 401);
  }
  
  c.set('user', user);
  await next();
};

// Public routes
app.get('/api', (c) => {
  return c.json({ message: 'ENSAM Stage Management API', version: '1.0.0' });
});

// Auth routes
app.post('/api/auth/login', async (c) => {
  try {
    const { email, password, role } = await c.req.json();
    
    if (role === 'admin') {
      const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
      if (!admin || !bcrypt.compareSync(password, admin.password)) {
        return c.json({ error: 'Identifiants incorrects' }, 401);
      }
      
      const user = { id: admin.id, email: admin.email, name: admin.name, role: 'admin' };
      const token = generateToken(user);
      return c.json({ token, user });
    }
    
    if (role === 'student') {
      const student = db.prepare('SELECT * FROM students WHERE email = ? AND is_registered = 1').get(email);
      if (!student || !student.password || !bcrypt.compareSync(password, student.password)) {
        return c.json({ error: 'Identifiants incorrects' }, 401);
      }
      
      const user = { id: student.id, email: student.email, name: student.nom, role: 'student' };
      const token = generateToken(user);
      return c.json({ token, user });
    }
    
    return c.json({ error: 'Rôle invalide' }, 400);
  } catch (error) {
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

app.post('/api/auth/register', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    const student = db.prepare('SELECT * FROM students WHERE email = ?').get(email);
    if (!student) {
      return c.json({ error: 'Email non trouvé dans la base' }, 400);
    }
    
    if (student.is_registered) {
      return c.json({ error: 'Compte déjà créé' }, 400);
    }
    
    const hashedPassword = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE students SET password = ?, is_registered = 1 WHERE id = ?').run(hashedPassword, student.id);
    
    return c.json({ message: 'Compte créé avec succès' });
  } catch (error) {
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

app.post('/api/auth/verify', async (c) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  const user = verifyToken(token || '');
  if (!user) {
    return c.json({ error: 'Token invalide' }, 401);
  }
  
  return c.json({ user });
});

// Admin routes
app.get('/api/admin/students', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin') {
    return c.json({ error: 'Accès non autorisé' }, 403);
  }
  
  const students = db.prepare('SELECT * FROM students ORDER BY created_at DESC').all();
  return c.json({ students });
});

app.post('/api/admin/students', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin') {
    return c.json({ error: 'Accès non autorisé' }, 403);
  }
  
  try {
    const studentData = await c.req.json();
    const result = db.prepare(`
      INSERT INTO students (nom, email, telephone, filiere, annee, code_apogee, cne, cin, date_naissance, is_registered)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(
      studentData.nom,
      studentData.email,
      studentData.telephone,
      studentData.filiere,
      studentData.annee,
      studentData.codeApogee,
      studentData.cne,
      studentData.cin,
      studentData.dateNaissance
    );
    
    const newStudent = db.prepare('SELECT * FROM students WHERE id = ?').get(result.lastInsertRowid);
    return c.json({ student: newStudent });
  } catch (error) {
    return c.json({ error: 'Erreur lors de l\'ajout' }, 500);
  }
});

app.delete('/api/admin/students/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin') {
    return c.json({ error: 'Accès non autorisé' }, 403);
  }
  
  const studentId = parseInt(c.req.param('id'));
  db.prepare('DELETE FROM students WHERE id = ?').run(studentId);
  return c.json({ message: 'Étudiant supprimé' });
});

// Import students from CSV/Excel
app.post('/api/admin/import', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin') {
    return c.json({ error: 'Accès non autorisé' }, 403);
  }
  
  try {
    const formData = await c.req.formData();
    const file = formData.get('file');
    
    if (!file) {
      return c.json({ error: 'Aucun fichier fourni' }, 400);
    }
    
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return c.json({ error: 'Fichier CSV vide ou invalide' }, 400);
    }
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    let importedCount = 0;
    let errors = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      if (values.length < headers.length) continue;
      
      try {
        const studentData = {};
        headers.forEach((header, index) => {
          studentData[header] = values[index];
        });
        
        // Map headers to expected field names
        const nom = studentData.nom || studentData.name || '';
        const email = studentData.email || studentData.mail || '';
        const filiere = studentData.filiere || studentData.filière || '';
        const annee = parseInt(studentData.annee || studentData.année || '1');
        const codeApogee = studentData.code_apogee || studentData['code apogée'] || '';
        const cne = studentData.cne || '';
        const cin = studentData.cin || '';
        const dateNaissance = studentData.date_naissance || studentData['date naissance'] || '';
        const telephone = studentData.telephone || studentData.téléphone || '';
        
        if (!nom || !email || !filiere || !codeApogee || !cne || !cin) {
          errors.push(`Ligne ${i + 1}: Données manquantes`);
          continue;
        }
        
        // Check if student already exists
        const existing = db.prepare('SELECT id FROM students WHERE email = ? OR cne = ? OR cin = ? OR code_apogee = ?').get(email, cne, cin, codeApogee);
        
        if (existing) {
          errors.push(`${nom}: Déjà existant`);
          continue;
        }
        
        db.prepare(`
          INSERT INTO students (nom, email, telephone, filiere, annee, code_apogee, cne, cin, date_naissance, is_registered)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
        `).run(nom, email, telephone, filiere, annee, codeApogee, cne, cin, dateNaissance);
        
        importedCount++;
      } catch (error) {
        errors.push(`Ligne ${i + 1}: Erreur d'insertion`);
      }
    }
    
    return c.json({
      result: {
        success: importedCount > 0,
        totalRows: lines.length - 1,
        importedRows: importedCount,
        errors,
        duplicates: []
      }
    });
  } catch (error) {
    return c.json({ error: 'Erreur lors de l\'import' }, 500);
  }
});

// Student routes  
app.get('/api/student/profile', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'student') {
    return c.json({ error: 'Accès non autorisé' }, 403);
  }
  
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(user.id);
  return c.json({ student });
});

app.get('/api/student/conventions', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'student') {
    return c.json({ error: 'Accès non autorisé' }, 403);
  }
  
  const conventions = db.prepare('SELECT * FROM conventions WHERE student_id = ? ORDER BY generated_at DESC').all(user.id);
  return c.json({ conventions });
});

const port = 3001;

console.log('🔄 Démarrage du backend SQLite avec Node.js...');
console.log('✅ Admin par défaut: admin@ensam.ac.ma / AdminENSAM2024!');
console.log('📊 Base de données SQLite: ensam_stages.db');

serve({
  fetch: app.fetch,
  port: port,
}, (info) => {
  console.log(`✅ Serveur backend démarré sur http://localhost:${info.port}`);
  console.log('📁 Routes disponibles:');
  console.log('   • POST /api/auth/login');
  console.log('   • POST /api/auth/register');
  console.log('   • GET  /api/admin/students');
  console.log('   • POST /api/admin/import');
  console.log('   • GET  /api/student/profile');
  console.log('   • GET  /api/student/conventions');
  console.log('');
  console.log('📝 Pour tester l\'import:');
  console.log('   1. Se connecter comme admin');
  console.log('   2. Aller dans Gestion Étudiants');
  console.log('   3. Utiliser le bouton "Importer"');
});