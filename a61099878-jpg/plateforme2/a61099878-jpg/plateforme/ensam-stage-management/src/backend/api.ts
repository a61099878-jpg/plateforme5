import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import { initDatabase, db, schema } from './db';
import { 
  authenticateAdmin, 
  authenticateStudent, 
  generateToken, 
  verifyToken, 
  registerStudent,
  type AuthUser 
} from './services/auth';
import { 
  parseCSVFile, 
  parseExcelFile, 
  importStudents, 
  exportStudents,
  type StudentImportData 
} from './services/import';
import { generateConventionPDF, getStageType } from './services/pdf';
import { eq, desc, or } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

const app = new Hono();

// Initialize database
initDatabase();

// Middleware
app.use('*', cors());

const JWT_SECRET = process.env.JWT_SECRET || 'ensam-stage-secret-key-2024';

// JWT middleware for protected routes
const authMiddleware = jwt({
  secret: JWT_SECRET,
});

// Utility to get user from token
const getCurrentUser = async (c: any): Promise<AuthUser | null> => {
  try {
    const token = c.get('jwtPayload');
    return token as AuthUser;
  } catch (error) {
    return null;
  }
};

// Public routes
app.get('/api', (c) => {
  return c.json({ message: 'ENSAM Stage Management API', version: '1.0.0' });
});

// Authentication routes
app.post('/api/auth/login', async (c) => {
  try {
    const { email, password, role } = await c.req.json();
    
    let user: AuthUser | null = null;
    
    if (role === 'admin') {
      user = await authenticateAdmin(email, password);
    } else if (role === 'student') {
      user = await authenticateStudent(email, password);
    }
    
    if (!user) {
      return c.json({ error: 'Identifiants incorrects' }, 401);
    }
    
    const token = generateToken(user);
    
    return c.json({ 
      token, 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      } 
    });
  } catch (error) {
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

app.post('/api/auth/register', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    const success = await registerStudent(email, password);
    
    if (!success) {
      return c.json({ error: 'Email non trouvé dans la base ou déjà enregistré' }, 400);
    }
    
    return c.json({ message: 'Compte créé avec succès' });
  } catch (error) {
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

app.post('/api/auth/verify', authMiddleware, async (c) => {
  try {
    const user = await getCurrentUser(c);
    if (!user) {
      return c.json({ error: 'Token invalide' }, 401);
    }
    return c.json({ user });
  } catch (error) {
    return c.json({ error: 'Token invalide' }, 401);
  }
});

// Admin routes
app.use('/api/admin/*', authMiddleware);

app.get('/api/admin/students', async (c) => {
  try {
    const user = await getCurrentUser(c);
    if (!user || user.role !== 'admin') {
      return c.json({ error: 'Accès non autorisé' }, 403);
    }
    
    const students = await db.query.students.findMany({
      orderBy: [desc(schema.students.createdAt)]
    });
    
    return c.json({ students });
  } catch (error) {
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

app.post('/api/admin/students', async (c) => {
  try {
    const user = await getCurrentUser(c);
    if (!user || user.role !== 'admin') {
      return c.json({ error: 'Accès non autorisé' }, 403);
    }
    
    const studentData = await c.req.json();
    
    const newStudent = await db.insert(schema.students).values({
      nom: studentData.nom,
      email: studentData.email,
      telephone: studentData.telephone,
      filiere: studentData.filiere,
      annee: studentData.annee,
      codeApogee: studentData.codeApogee,
      cne: studentData.cne,
      cin: studentData.cin,
      dateNaissance: studentData.dateNaissance,
      isRegistered: false
    }).returning();
    
    return c.json({ student: newStudent[0] });
  } catch (error) {
    return c.json({ error: 'Erreur lors de l\'ajout de l\'étudiant' }, 500);
  }
});

app.put('/api/admin/students/:id', async (c) => {
  try {
    const user = await getCurrentUser(c);
    if (!user || user.role !== 'admin') {
      return c.json({ error: 'Accès non autorisé' }, 403);
    }
    
    const studentId = parseInt(c.req.param('id'));
    const studentData = await c.req.json();
    
    const updatedStudent = await db.update(schema.students)
      .set({
        nom: studentData.nom,
        email: studentData.email,
        telephone: studentData.telephone,
        filiere: studentData.filiere,
        annee: studentData.annee,
        codeApogee: studentData.codeApogee,
        cne: studentData.cne,
        cin: studentData.cin,
        dateNaissance: studentData.dateNaissance
      })
      .where(eq(schema.students.id, studentId))
      .returning();
    
    return c.json({ student: updatedStudent[0] });
  } catch (error) {
    return c.json({ error: 'Erreur lors de la modification' }, 500);
  }
});

app.delete('/api/admin/students/:id', async (c) => {
  try {
    const user = await getCurrentUser(c);
    if (!user || user.role !== 'admin') {
      return c.json({ error: 'Accès non autorisé' }, 403);
    }
    
    const studentId = parseInt(c.req.param('id'));
    
    await db.delete(schema.students)
      .where(eq(schema.students.id, studentId));
    
    return c.json({ message: 'Étudiant supprimé' });
  } catch (error) {
    return c.json({ error: 'Erreur lors de la suppression' }, 500);
  }
});

app.post('/api/admin/import', async (c) => {
  try {
    const user = await getCurrentUser(c);
    if (!user || user.role !== 'admin') {
      return c.json({ error: 'Accès non autorisé' }, 403);
    }
    
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return c.json({ error: 'Aucun fichier fourni' }, 400);
    }
    
    const buffer = await file.arrayBuffer();
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    let students: StudentImportData[] = [];
    
    if (fileExtension === 'csv') {
      const csvContent = new TextDecoder().decode(buffer);
      students = parseCSVFile(csvContent);
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      students = parseExcelFile(Buffer.from(buffer));
    } else {
      return c.json({ error: 'Format de fichier non supporté' }, 400);
    }
    
    const result = await importStudents(students);
    
    return c.json({ result });
  } catch (error) {
    return c.json({ error: 'Erreur lors de l\'import' }, 500);
  }
});

app.get('/api/admin/export', async (c) => {
  try {
    const user = await getCurrentUser(c);
    if (!user || user.role !== 'admin') {
      return c.json({ error: 'Accès non autorisé' }, 403);
    }
    
    const buffer = await exportStudents();
    
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=etudiants_ensam_${new Date().toISOString().split('T')[0]}.xlsx`
      }
    });
  } catch (error) {
    return c.json({ error: 'Erreur lors de l\'export' }, 500);
  }
});

app.get('/api/admin/conventions', async (c) => {
  try {
    const user = await getCurrentUser(c);
    if (!user || user.role !== 'admin') {
      return c.json({ error: 'Accès non autorisé' }, 403);
    }
    
    const conventions = await db.query.conventions.findMany({
      with: {
        student: true
      },
      orderBy: [desc(schema.conventions.generatedAt)]
    });
    
    return c.json({ conventions });
  } catch (error) {
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

app.put('/api/admin/conventions/:id/status', async (c) => {
  try {
    const user = await getCurrentUser(c);
    if (!user || user.role !== 'admin') {
      return c.json({ error: 'Accès non autorisé' }, 403);
    }
    
    const conventionId = parseInt(c.req.param('id'));
    const { status, notes } = await c.req.json();
    
    const now = new Date().toISOString();
    const updateData: any = { status, adminNotes: notes };
    
    if (status === 'valide') {
      updateData.validatedAt = now;
    } else if (status === 'rejete') {
      updateData.rejectedAt = now;
    }
    
    const updatedConvention = await db.update(schema.conventions)
      .set(updateData)
      .where(eq(schema.conventions.id, conventionId))
      .returning();
    
    return c.json({ convention: updatedConvention[0] });
  } catch (error) {
    return c.json({ error: 'Erreur lors de la mise à jour' }, 500);
  }
});

// Student routes
app.use('/api/student/*', authMiddleware);

app.get('/api/student/profile', async (c) => {
  try {
    const user = await getCurrentUser(c);
    if (!user || user.role !== 'student') {
      return c.json({ error: 'Accès non autorisé' }, 403);
    }
    
    const student = await db.query.students.findFirst({
      where: eq(schema.students.id, user.id)
    });
    
    if (!student) {
      return c.json({ error: 'Étudiant non trouvé' }, 404);
    }
    
    return c.json({ student });
  } catch (error) {
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

app.get('/api/student/convention/generate', async (c) => {
  try {
    const user = await getCurrentUser(c);
    if (!user || user.role !== 'student') {
      return c.json({ error: 'Accès non autorisé' }, 403);
    }
    
    const student = await db.query.students.findFirst({
      where: eq(schema.students.id, user.id)
    });
    
    if (!student) {
      return c.json({ error: 'Étudiant non trouvé' }, 404);
    }
    
    const pdfBuffer = await generateConventionPDF(student);
    const typeStage = getStageType(student.annee);
    
    // Save convention record
    await db.insert(schema.conventions).values({
      studentId: student.id,
      typeStage,
      status: 'en_attente'
    });
    
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=convention_${typeStage}_${student.nom.replace(/\s+/g, '_')}.pdf`
      }
    });
  } catch (error) {
    return c.json({ error: 'Erreur lors de la génération du PDF' }, 500);
  }
});

app.get('/api/student/conventions', async (c) => {
  try {
    const user = await getCurrentUser(c);
    if (!user || user.role !== 'student') {
      return c.json({ error: 'Accès non autorisé' }, 403);
    }
    
    const conventions = await db.query.conventions.findMany({
      where: eq(schema.conventions.studentId, user.id),
      orderBy: [desc(schema.conventions.generatedAt)]
    });
    
    return c.json({ conventions });
  } catch (error) {
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

app.post('/api/student/convention/:id/upload', async (c) => {
  try {
    const user = await getCurrentUser(c);
    if (!user || user.role !== 'student') {
      return c.json({ error: 'Accès non autorisé' }, 403);
    }
    
    const conventionId = parseInt(c.req.param('id'));
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return c.json({ error: 'Aucun fichier fourni' }, 400);
    }
    
    // Verify convention belongs to student
    const convention = await db.query.conventions.findFirst({
      where: eq(schema.conventions.id, conventionId)
    });
    
    if (!convention || convention.studentId !== user.id) {
      return c.json({ error: 'Convention non trouvée' }, 404);
    }
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Save file
    const buffer = await file.arrayBuffer();
    const fileExtension = file.name.split('.').pop();
    const fileName = `convention_${conventionId}_${Date.now()}.${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);
    
    fs.writeFileSync(filePath, Buffer.from(buffer));
    
    // Update convention
    const updatedConvention = await db.update(schema.conventions)
      .set({
        filePath,
        fileName: file.name,
        status: 'envoye',
        submittedAt: new Date().toISOString()
      })
      .where(eq(schema.conventions.id, conventionId))
      .returning();
    
    return c.json({ convention: updatedConvention[0] });
  } catch (error) {
    return c.json({ error: 'Erreur lors de l\'upload' }, 500);
  }
});

app.get('/api/admin/convention/:id/download', async (c) => {
  try {
    const user = await getCurrentUser(c);
    if (!user || user.role !== 'admin') {
      return c.json({ error: 'Accès non autorisé' }, 403);
    }
    
    const conventionId = parseInt(c.req.param('id'));
    
    const convention = await db.query.conventions.findFirst({
      where: eq(schema.conventions.id, conventionId)
    });
    
    if (!convention || !convention.filePath) {
      return c.json({ error: 'Fichier non trouvé' }, 404);
    }
    
    if (!fs.existsSync(convention.filePath)) {
      return c.json({ error: 'Fichier physique non trouvé' }, 404);
    }
    
    const fileBuffer = fs.readFileSync(convention.filePath);
    const mimeType = convention.fileName?.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';
    
    return new Response(fileBuffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename=${convention.fileName}`
      }
    });
  } catch (error) {
    return c.json({ error: 'Erreur lors du téléchargement' }, 500);
  }
});

export default app;