const { Hono } = require('hono');
const { serve } = require('@hono/node-server');
const { cors } = require('hono/cors');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const app = new Hono();

// Initialize SQLite database with absolute path
const db = new Database(path.join(process.cwd(), 'ensam_stages.db'));

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

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Répertoire uploads créé');
}

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

// Helper function to map database fields to API format
function mapStudentFromDB(student) {
  return {
    id: student.id,
    email: student.email,
    nom: student.nom,
    telephone: student.telephone,
    filiere: student.filiere,
    annee: student.annee,
    codeApogee: student.code_apogee,
    cne: student.cne,
    cin: student.cin,
    dateNaissance: student.date_naissance,
    isRegistered: Boolean(student.is_registered),
    createdAt: student.created_at
  };
}

// Admin routes
app.get('/api/admin/students', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin') {
    return c.json({ error: 'Accès non autorisé' }, 403);
  }
  
  const students = db.prepare('SELECT * FROM students ORDER BY created_at DESC').all();
  const mappedStudents = students.map(mapStudentFromDB);
  return c.json({ students: mappedStudents });
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
    return c.json({ student: mapStudentFromDB(newStudent) });
  } catch (error) {
    console.error('Erreur ajout étudiant:', error);
    return c.json({ error: 'Erreur lors de l\'ajout' }, 500);
  }
});

app.put('/api/admin/students/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin') {
    return c.json({ error: 'Accès non autorisé' }, 403);
  }
  
  try {
    const studentId = parseInt(c.req.param('id'));
    const studentData = await c.req.json();
    
    // Check if student exists
    const existingStudent = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
    if (!existingStudent) {
      return c.json({ error: 'Étudiant non trouvé' }, 404);
    }
    
    db.prepare(`
      UPDATE students 
      SET nom = ?, email = ?, telephone = ?, filiere = ?, annee = ?, 
          code_apogee = ?, cne = ?, cin = ?, date_naissance = ?
      WHERE id = ?
    `).run(
      studentData.nom,
      studentData.email,
      studentData.telephone,
      studentData.filiere,
      studentData.annee,
      studentData.codeApogee,
      studentData.cne,
      studentData.cin,
      studentData.dateNaissance,
      studentId
    );
    
    const updatedStudent = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
    return c.json({ student: mapStudentFromDB(updatedStudent) });
  } catch (error) {
    console.error('Erreur modification étudiant:', error);
    return c.json({ error: 'Erreur lors de la modification' }, 500);
  }
});

app.delete('/api/admin/students/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin') {
    return c.json({ error: 'Accès non autorisé' }, 403);
  }
  
  try {
    const studentId = parseInt(c.req.param('id'));
    
    // Check if student exists
    const existingStudent = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
    if (!existingStudent) {
      return c.json({ error: 'Étudiant non trouvé' }, 404);
    }
    
    // Delete associated conventions first
    db.prepare('DELETE FROM conventions WHERE student_id = ?').run(studentId);
    
    // Delete student
    db.prepare('DELETE FROM students WHERE id = ?').run(studentId);
    
    return c.json({ message: 'Étudiant supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression étudiant:', error);
    return c.json({ error: 'Erreur lors de la suppression' }, 500);
  }
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
    
    console.log('Début de l\'import, fichier:', file.name, 'taille:', file.size);
    
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return c.json({ error: 'Fichier CSV vide ou invalide' }, 400);
    }
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/["']/g, ''));
    console.log('En-têtes détectés:', headers);
    
    let importedCount = 0;
    let duplicatesCount = 0;
    let errors = [];
    let duplicates = [];
    
    // Start transaction for better performance and data integrity
    const insertStmt = db.prepare(`
      INSERT INTO students (nom, email, telephone, filiere, annee, code_apogee, cne, cin, date_naissance, is_registered)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `);
    
    const checkExistingStmt = db.prepare('SELECT id, nom FROM students WHERE email = ? OR cne = ? OR cin = ? OR code_apogee = ?');
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/["']/g, ''));
      
      if (values.length < headers.length) {
        errors.push(`Ligne ${i + 1}: Nombre de colonnes incorrect`);
        continue;
      }
      
      try {
        const studentData = {};
        headers.forEach((header, index) => {
          studentData[header] = values[index] || '';
        });
        
        // Map headers to expected field names with more flexible matching
        const nom = studentData.nom || studentData.name || studentData.prenom || studentData.prénom || '';
        const email = studentData.email || studentData.mail || studentData.adresse_email || '';
        const filiere = studentData.filiere || studentData.filière || studentData.specialite || studentData.spécialité || '';
        const annee = parseInt(studentData.annee || studentData.année || studentData.level || studentData.niveau || '1');
        const codeApogee = studentData.code_apogee || studentData['code apogée'] || studentData.apogee || studentData.code || '';
        const cne = studentData.cne || studentData.numero_etudiant || studentData.num_etudiant || '';
        const cin = studentData.cin || studentData.carte_identite || studentData.id_number || '';
        const dateNaissance = studentData.date_naissance || studentData['date naissance'] || studentData.birth_date || studentData.naissance || '';
        const telephone = studentData.telephone || studentData.téléphone || studentData.phone || studentData.tel || '';
        
        // Validation des champs obligatoires
        if (!nom.trim()) {
          errors.push(`Ligne ${i + 1}: Nom manquant`);
          continue;
        }
        if (!email.trim() || !email.includes('@')) {
          errors.push(`Ligne ${i + 1}: Email invalide ou manquant`);
          continue;
        }
        if (!filiere.trim()) {
          errors.push(`Ligne ${i + 1}: Filière manquante`);
          continue;
        }
        if (!codeApogee.trim()) {
          errors.push(`Ligne ${i + 1}: Code Apogée manquant`);
          continue;
        }
        if (!cne.trim()) {
          errors.push(`Ligne ${i + 1}: CNE manquant`);
          continue;
        }
        if (!cin.trim()) {
          errors.push(`Ligne ${i + 1}: CIN manquant`);
          continue;
        }
        
        // Vérifier si l'étudiant existe déjà
        const existing = checkExistingStmt.get(email.trim(), cne.trim(), cin.trim(), codeApogee.trim());
        
        if (existing) {
          duplicatesCount++;
          duplicates.push(`${nom.trim()} (${email.trim()})`);
          continue;
        }
        
        // Insérer l'étudiant
        insertStmt.run(
          nom.trim(),
          email.trim().toLowerCase(),
          telephone.trim(),
          filiere.trim(),
          isNaN(annee) ? 1 : annee,
          codeApogee.trim(),
          cne.trim(),
          cin.trim(),
          dateNaissance.trim()
        );
        
        importedCount++;
        console.log(`Étudiant importé: ${nom.trim()} (${email.trim()})`);
        
      } catch (error) {
        console.error(`Erreur ligne ${i + 1}:`, error);
        errors.push(`Ligne ${i + 1}: ${error.message}`);
      }
    }
    
    console.log(`Import terminé: ${importedCount} importés, ${duplicatesCount} doublons, ${errors.length} erreurs`);
    
    return c.json({
      result: {
        success: importedCount > 0,
        totalRows: lines.length - 1,
        importedRows: importedCount,
        duplicatesCount,
        errors,
        duplicates
      }
    });
  } catch (error) {
    console.error('Erreur import:', error);
    return c.json({ error: `Erreur lors de l'import: ${error.message}` }, 500);
  }
});

// Export students to CSV
app.get('/api/admin/export', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin') {
    return c.json({ error: 'Accès non autorisé' }, 403);
  }
  
  const students = db.prepare('SELECT * FROM students ORDER BY nom').all();
  
  // Simple CSV export
  const csvHeaders = 'nom,email,telephone,filiere,annee,code_apogee,cne,cin,date_naissance,is_registered';
  const csvRows = students.map(s => 
    `${s.nom},${s.email},${s.telephone || ''},${s.filiere},${s.annee},${s.code_apogee},${s.cne},${s.cin},${s.date_naissance},${s.is_registered ? 'Oui' : 'Non'}`
  );
  const csvContent = [csvHeaders, ...csvRows].join('\n');
  
  return new Response(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename=etudiants_export.csv'
    }
  });
});

// Student routes  
app.get('/api/student/profile', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'student') {
    return c.json({ error: 'Accès non autorisé' }, 403);
  }
  
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(user.id);
  if (!student) {
    return c.json({ error: 'Étudiant non trouvé' }, 404);
  }
  
  return c.json({ student: mapStudentFromDB(student) });
});

app.get('/api/student/conventions', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'student') {
    return c.json({ error: 'Accès non autorisé' }, 403);
  }
  
  const conventions = db.prepare('SELECT * FROM conventions WHERE student_id = ? ORDER BY generated_at DESC').all(user.id);
  const mappedConventions = conventions.map(mapConventionFromDB);
  return c.json({ conventions: mappedConventions });
});

// Generate convention PDF
app.get('/api/student/convention/generate', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'student') {
    return c.json({ error: 'Accès non autorisé' }, 403);
  }
  
  try {
    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(user.id);
    if (!student) {
      return c.json({ error: 'Étudiant non trouvé' }, 404);
    }
    
    const typeStage = student.annee === 1 ? 'initiation' : student.annee === 2 ? 'fin_annee' : 'fin_etudes';
    
    // Create convention record
    const result = db.prepare('INSERT INTO conventions (student_id, type_stage, status) VALUES (?, ?, ?)').run(
      student.id, 
      typeStage, 
      'en_attente'
    );
    
    // Generate HTML content with print functionality
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Convention de Stage - ${student.nom}</title>
        <style>
            @page {
                margin: 2cm;
                size: A4;
            }
            @media print {
                body { 
                    -webkit-print-color-adjust: exact;
                    color-adjust: exact;
                }
                .no-print { display: none; }
                .page-break { page-break-before: always; }
            }
            body { 
                font-family: 'Arial', sans-serif; 
                margin: 0;
                padding: 0;
                line-height: 1.6; 
                color: #333;
                font-size: 12px;
            }
            .header { 
                text-align: center; 
                margin-bottom: 40px; 
                border-bottom: 3px solid #2c5aa0;
                padding-bottom: 20px;
            }
            .logo { 
                font-size: 28px; 
                font-weight: bold; 
                color: #2c5aa0; 
                margin-bottom: 10px;
            }
            .title { 
                font-size: 22px; 
                margin: 15px 0;
                color: #333;
                font-weight: bold;
            }
            .section { 
                margin: 25px 0; 
                page-break-inside: avoid;
            }
            .section h3 {
                background-color: #f8f9fa;
                padding: 10px 15px;
                margin: 0 0 15px 0;
                border-left: 4px solid #2c5aa0;
                font-size: 16px;
                color: #2c5aa0;
            }
            .field { 
                margin: 8px 0; 
                display: flex;
                align-items: center;
            }
            .field strong {
                min-width: 150px;
                color: #555;
            }
            .signature { 
                margin-top: 60px; 
                display: flex; 
                justify-content: space-between;
                page-break-inside: avoid;
            }
            .signature div {
                text-align: center;
                width: 30%;
            }
            .signature p {
                margin: 5px 0;
            }
            .signature-line {
                border-bottom: 1px solid #333;
                width: 80%;
                margin: 30px auto 10px auto;
                height: 1px;
            }
            .info-box {
                background-color: #e8f4fd;
                border: 1px solid #2c5aa0;
                border-radius: 8px;
                padding: 15px;
                margin: 20px 0;
            }
            .footer {
                position: fixed;
                bottom: 1cm;
                left: 0;
                right: 0;
                text-align: center;
                font-size: 10px;
                color: #666;
                border-top: 1px solid #ddd;
                padding-top: 10px;
            }
            /* Print Button Styles */
            .print-header {
                background: #f8f9fa;
                padding: 15px;
                margin-bottom: 20px;
                border: 1px solid #dee2e6;
                border-radius: 8px;
                text-align: center;
            }
            .print-btn {
                background: #007bff;
                color: white;
                padding: 10px 20px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
                margin: 0 10px;
            }
            .print-btn:hover {
                background: #0056b3;
            }
        </style>
        <script>
            function printPDF() {
                window.print();
            }
            function downloadHTML() {
                const element = document.documentElement;
                const html = element.outerHTML;
                const blob = new Blob([html], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'convention_${typeStage}_${student.nom.replace(/\s+/g, '_')}.html';
                a.click();
                URL.revokeObjectURL(url);
            }
        </script>
    </head>
    <body>
        <div class="print-header no-print">
            <h2>🎓 Convention de Stage - ENSAM Rabat</h2>
            <p><strong>Étudiant:</strong> ${student.nom} | <strong>Type:</strong> ${typeStage.replace('_', ' ')} | <strong>Filière:</strong> ${student.filiere}</p>
            <button class="print-btn" onclick="printPDF()">🖨️ Imprimer / Sauver en PDF</button>
            <button class="print-btn" onclick="downloadHTML()">💾 Télécharger HTML</button>
            <p style="margin-top: 10px; font-size: 14px; color: #666;">💡 <strong>Instructions:</strong> Cliquez sur "Imprimer / Sauver en PDF" et choisissez "Enregistrer au format PDF" dans votre navigateur.</p>
        </div>
        <div class="header">
            <div class="logo">ÉCOLE NATIONALE SUPÉRIEURE DES ARTS ET MÉTIERS</div>
            <div class="logo">ENSAM - RABAT</div>
            <div class="title">Convention de Stage ${typeStage === 'initiation' ? 'd\'Initiation' : typeStage === 'fin_annee' ? 'de Fin d\'Année' : 'de Fin d\'Études'}</div>
            <p style="margin: 0; color: #666;">Année universitaire ${new Date().getFullYear()}-${new Date().getFullYear() + 1}</p>
        </div>
        
        <div class="section">
            <h3>Informations Étudiant</h3>
            <div class="field"><strong>Nom complet :</strong> ${student.nom}</div>
            <div class="field"><strong>Email :</strong> ${student.email}</div>
            <div class="field"><strong>Filière :</strong> ${student.filiere}</div>
            <div class="field"><strong>Année d'études :</strong> ${student.annee}ème année</div>
            <div class="field"><strong>Code Apogée :</strong> ${student.code_apogee}</div>
            <div class="field"><strong>CNE :</strong> ${student.cne}</div>
            <div class="field"><strong>CIN :</strong> ${student.cin}</div>
            <div class="field"><strong>Téléphone :</strong> ${student.telephone || 'Non renseigné'}</div>
        </div>
        
        <div class="section">
            <h3>Détails du Stage</h3>
            <div class="field"><strong>Type de stage :</strong> ${typeStage === 'initiation' ? 'Stage d\'Initiation' : typeStage === 'fin_annee' ? 'Stage de Fin d\'Année' : 'Stage de Fin d\'Études'}</div>
            <div class="field"><strong>Durée prévue :</strong> ${typeStage === 'initiation' ? '4 semaines' : typeStage === 'fin_annee' ? '8 semaines' : '12 semaines'}</div>
            <div class="field"><strong>Date de génération :</strong> ${new Date().toLocaleDateString('fr-FR')}</div>
            <div class="field"><strong>Période :</strong> À définir avec l'organisme d'accueil</div>
        </div>
        
        <div class="info-box">
            <h4 style="margin-top: 0; color: #2c5aa0;">Objectifs du stage :</h4>
            <p style="margin: 5px 0;">
                ${typeStage === 'initiation' ? 
                  'Découverte du monde professionnel et des métiers de l\'ingénieur. Observation et participation aux activités de l\'entreprise.' :
                  typeStage === 'fin_annee' ?
                  'Approfondissement des connaissances techniques et mise en pratique des enseignements théoriques dans un contexte professionnel.' :
                  'Réalisation d\'un projet d\'ingénieur complet, de la conception à la mise en œuvre, avec autonomie et responsabilités.'}
            </p>
        </div>
        
        <div class="section">
            <h3>Organisme d'Accueil</h3>
            <div class="field"><strong>Nom de l'entreprise :</strong> ___________________________________</div>
            <div class="field"><strong>Secteur d'activité :</strong> ___________________________________</div>
            <div class="field"><strong>Adresse complète :</strong> ___________________________________</div>
            <div class="field"><strong>Responsable/Encadrant :</strong> ___________________________________</div>
            <div class="field"><strong>Fonction :</strong> ___________________________________</div>
            <div class="field"><strong>Téléphone :</strong> ___________________________________</div>
            <div class="field"><strong>Email :</strong> ___________________________________</div>
        </div>
        
        <div class="section">
            <h3>Modalités</h3>
            <div class="field"><strong>Date de début :</strong> _____ / _____ / _______</div>
            <div class="field"><strong>Date de fin :</strong> _____ / _____ / _______</div>
            <div class="field"><strong>Horaires :</strong> ___________________________________</div>
            <div class="field"><strong>Gratification :</strong> ☐ Oui  ☐ Non  Montant : ________________</div>
            <div class="field"><strong>Transport :</strong> ☐ Pris en charge  ☐ À la charge du stagiaire</div>
            <div class="field"><strong>Restauration :</strong> ☐ Prise en charge  ☐ À la charge du stagiaire</div>
        </div>
        
        <div class="signature">
            <div>
                <p><strong>Signature de l'Étudiant</strong></p>
                <p style="font-size: 11px; color: #666;">Précédée de la mention</p>
                <p style="font-size: 11px; color: #666;">"Lu et approuvé"</p>
                <div class="signature-line"></div>
                <p style="font-size: 10px;">Date et signature</p>
            </div>
            <div>
                <p><strong>Cachet et Signature</strong></p>
                <p><strong>ENSAM Rabat</strong></p>
                <div class="signature-line"></div>
                <p style="font-size: 10px;">Date et signature</p>
            </div>
            <div>
                <p><strong>Cachet et Signature</strong></p>
                <p><strong>Organisme d'Accueil</strong></p>
                <div class="signature-line"></div>
                <p style="font-size: 10px;">Date et signature</p>
            </div>
        </div>
        
        <div class="footer">
            <p>ENSAM Rabat - École Nationale Supérieure des Arts et Métiers - Avenue de l'Armée Royale, Rabat, Maroc</p>
            <p>Tél. : +212 5 37 71 17 71 | Email : contact@ensam.ac.ma | Web : www.ensam.ac.ma</p>
        </div>
    </body>
    </html>
    `;
    
    // Return HTML for PDF printing/conversion
    return new Response(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename=convention_${typeStage}_${student.nom.replace(/\s+/g, '_')}.html`
      }
    });
  } catch (error) {
    console.error('Erreur génération PDF:', error);
    return c.json({ error: 'Erreur lors de la génération du PDF' }, 500);
  }
});

// Upload convention file
app.post('/api/student/convention/:id/upload', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'student') {
    return c.json({ error: 'Accès non autorisé' }, 403);
  }
  
  try {
    const conventionId = parseInt(c.req.param('id'));
    const formData = await c.req.formData();
    const file = formData.get('file');
    
    if (!file) {
      return c.json({ error: 'Aucun fichier fourni' }, 400);
    }
    
    // Verify convention belongs to student
    const convention = db.prepare('SELECT * FROM conventions WHERE id = ? AND student_id = ?').get(conventionId, user.id);
    if (!convention) {
      return c.json({ error: 'Convention non trouvée' }, 404);
    }
    
    // Validate file type
    const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      return c.json({ error: 'Type de fichier non autorisé. Utilisez PDF, DOC, DOCX, JPG ou PNG.' }, 400);
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return c.json({ error: 'Le fichier est trop volumineux (max 10MB)' }, 400);
    }
    
    // Save file
    const buffer = await file.arrayBuffer();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `convention_${conventionId}_${Date.now()}_${sanitizedFileName}`;
    const filePath = path.join(uploadsDir, fileName);
    
    fs.writeFileSync(filePath, Buffer.from(buffer));
    console.log(`Fichier sauvegardé: ${filePath}`);
    
    // Update convention
    db.prepare(`
      UPDATE conventions 
      SET file_path = ?, file_name = ?, status = 'envoye', submitted_at = datetime('now')
      WHERE id = ?
    `).run(filePath, sanitizedFileName, conventionId);
    
    const updatedConvention = db.prepare('SELECT * FROM conventions WHERE id = ?').get(conventionId);
    return c.json({ convention: mapConventionFromDB(updatedConvention) });
  } catch (error) {
    console.error('Erreur upload:', error);
    return c.json({ error: `Erreur lors de l'upload: ${error.message}` }, 500);
  }
});

// Helper function to map convention from DB
function mapConventionFromDB(convention) {
  return {
    id: convention.id,
    studentId: convention.student_id,
    typeStage: convention.type_stage,
    filePath: convention.file_path,
    fileName: convention.file_name,
    status: convention.status,
    generatedAt: convention.generated_at,
    submittedAt: convention.submitted_at,
    validatedAt: convention.validated_at,
    rejectedAt: convention.rejected_at,
    adminNotes: convention.admin_notes
  };
}

// Admin routes for conventions
app.get('/api/admin/conventions', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin') {
    return c.json({ error: 'Accès non autorisé' }, 403);
  }
  
  const conventions = db.prepare(`
    SELECT c.*, s.nom, s.email, s.filiere, s.annee, s.code_apogee, s.cne 
    FROM conventions c 
    JOIN students s ON c.student_id = s.id 
    ORDER BY c.generated_at DESC
  `).all();
  
  // Transform to match expected format
  const conventionsWithStudent = conventions.map(conv => {
    const mappedConv = mapConventionFromDB(conv);
    mappedConv.student = {
      id: conv.student_id,
      nom: conv.nom,
      email: conv.email,
      filiere: conv.filiere,
      annee: conv.annee,
      codeApogee: conv.code_apogee,
      cne: conv.cne
    };
    return mappedConv;
  });
  
  return c.json({ conventions: conventionsWithStudent });
});

app.put('/api/admin/conventions/:id/status', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin') {
    return c.json({ error: 'Accès non autorisé' }, 403);
  }
  
  try {
    const conventionId = parseInt(c.req.param('id'));
    const { status, notes } = await c.req.json();
    
    // Check if convention exists
    const existingConvention = db.prepare('SELECT * FROM conventions WHERE id = ?').get(conventionId);
    if (!existingConvention) {
      return c.json({ error: 'Convention non trouvée' }, 404);
    }
    
    let updateQuery = 'UPDATE conventions SET status = ?, admin_notes = ?';
    let params = [status, notes || ''];
    
    if (status === 'valide') {
      updateQuery += ', validated_at = datetime(\'now\'), rejected_at = NULL'; 
    } else if (status === 'rejete') {
      updateQuery += ', rejected_at = datetime(\'now\'), validated_at = NULL'; 
    } else {
      updateQuery += ', validated_at = NULL, rejected_at = NULL';
    }
    
    updateQuery += ' WHERE id = ?';
    params.push(conventionId);
    
    db.prepare(updateQuery).run(...params);
    
    const updatedConvention = db.prepare('SELECT * FROM conventions WHERE id = ?').get(conventionId);
    return c.json({ convention: mapConventionFromDB(updatedConvention) });
  } catch (error) {
    console.error('Erreur mise à jour convention:', error);
    return c.json({ error: 'Erreur lors de la mise à jour' }, 500);
  }
});

// Download convention file
app.get('/api/admin/convention/:id/download', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin') {
    return c.json({ error: 'Accès non autorisé' }, 403);
  }
  
  try {
    const conventionId = parseInt(c.req.param('id'));
    const convention = db.prepare('SELECT * FROM conventions WHERE id = ?').get(conventionId);
    
    if (!convention || !convention.file_path) {
      return c.json({ error: 'Fichier non trouvé' }, 404);
    }
    
    if (!fs.existsSync(convention.file_path)) {
      return c.json({ error: 'Fichier physique non trouvé' }, 404);
    }
    
    const fileBuffer = fs.readFileSync(convention.file_path);
    const mimeType = convention.file_name?.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';
    
    return new Response(fileBuffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename=${convention.file_name}`
      }
    });
  } catch (error) {
    return c.json({ error: 'Erreur lors du téléchargement' }, 500);
  }
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
  console.log('   • GET  /api/admin/export');
  console.log('   • GET  /api/admin/conventions');
  console.log('   • PUT  /api/admin/conventions/:id/status');
  console.log('   • GET  /api/admin/convention/:id/download');
  console.log('   • GET  /api/student/profile');
  console.log('   • GET  /api/student/conventions');
  console.log('   • GET  /api/student/convention/generate');
  console.log('   • POST /api/student/convention/:id/upload');
  console.log('');
  console.log('📝 Pour tester l\'import:');
  console.log('   1. Se connecter comme admin');
  console.log('   2. Aller dans Gestion Étudiants');
  console.log('   3. Utiliser le bouton "Importer"');
});